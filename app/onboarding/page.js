'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, Check, TrendingUp, AlertCircle, X, Sparkles, Plus, Trash2, Pencil } from 'lucide-react'

const STEPS = ['Course', 'Niveau', 'Références', 'Dispo', 'Objectif', 'Tracker']

const DISTANCES = [
  { value: '5K', label: '5K' },
  { value: '10K', label: '10K' },
  { value: 'Semi', label: 'Semi' },
  { value: 'Marathon', label: 'Marathon' },
  { value: 'Autres', label: 'Autres' },
]

const KM_WEEK_OPTIONS = [
  { value: '<30km',  label: '< 30 km' },
  { value: '30-60km', label: '30 – 60 km' },
  { value: '>60km',  label: '> 60 km' },
]

const EXPERIENCE_OPTIONS = [
  { value: '< 1 an',  label: '< 1 an' },
  { value: '1-5 ans', label: '1 – 5 ans' },
  { value: '> 5 ans', label: '> 5 ans' },
]

const ENDURANCE_SPORTS = [
  { value: 'Cyclisme', label: 'Cyclisme' },
  { value: 'Natation', label: 'Natation' },
  { value: 'Marche',   label: 'Marche' },
  { value: 'Autre',    label: 'Autre' },
]

const REF_DISTANCE_OPTIONS = ['5K', '10K', 'Semi', 'Marathon', 'Autre']

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const MIN_WEEKS_WARN = 4
const MIN_WEEKS_PLAN = { '5K': 3, '10K': 4, 'Semi': 6, 'Marathon': 8, 'Autres': 4 }
const DIST_KM = { '5K': 5, '10K': 10, 'Semi': 21.1, 'Marathon': 42.195 }
const DEFAULT_SESSIONS = { '5K': 3, '10K': 3, 'Semi': 4, 'Marathon': 5, 'Autres': 3 }
const SESSION_HINTS = {
  '5K': '3 à 4 séances recommandées',
  '10K': '3 à 4 séances recommandées',
  'Semi': '4 à 5 séances recommandées',
  'Marathon': '4 à 5 séances recommandées, dont une sortie longue le week-end',
  'Autres': '3 à 4 séances recommandées',
}

// ── Pure helpers ──────────────────────────────

function parseTimeToMin(str) {
  if (!str) return null
  str = str.trim().toLowerCase().replace(/\s/g, '')
  let m
  m = str.match(/^(\d+)h(\d+):(\d+)$/)
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 60
  m = str.match(/^(\d+)h(\d+)$/)
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2])
  m = str.match(/^(\d+):(\d+):(\d+)$/)
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 60
  m = str.match(/^(\d+):(\d+)$/)
  if (m) return parseInt(m[1]) + parseInt(m[2]) / 60
  return null
}

function riegel(t1Min, d1Km, d2Km) {
  return t1Min * Math.pow(d2Km / d1Km, 1.06)
}

function formatMin(min) {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  const s = Math.round((min % 1) * 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}${s > 0 ? ':' + s.toString().padStart(2, '0') : ''}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function calcPace(durationStr, distanceKey, customDistKm) {
  const min = parseTimeToMin(durationStr)
  const km = distanceKey === 'Autre' ? customDistKm : DIST_KM[distanceKey]
  if (!min || !km || km <= 0) return null
  return formatMin(min / km) + '/km'
}

function isChronoCoherent(durationStr, distanceKey, customDistKm) {
  const min = parseTimeToMin(durationStr)
  const km = distanceKey === 'Autre' ? customDistKm : DIST_KM[distanceKey]
  if (!min || !km) return true
  const paceMin = min / km
  return paceMin >= 2.5 && paceMin <= 15
}

function computeConfidence(data) {
  let score = 70
  const signals = []

  const effectiveDist = data.distance === 'Autres' ? (data.customDistance || 'Autre') : data.distance
  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const minWeeks = MIN_WEEKS_PLAN[data.distance] || 4

  if (weeksUntilRace !== null) {
    const ratio = weeksUntilRace / (minWeeks || 1)
    if (ratio >= 2) { score += 15; signals.push({ type: 'positive', text: `${weeksUntilRace} semaines — délai idéal` }) }
    else if (ratio >= 1.3) { score += 5; signals.push({ type: 'positive', text: `${weeksUntilRace} semaines, bonne marge` }) }
    else if (ratio >= 1) { signals.push({ type: 'warning', text: `${weeksUntilRace} semaines, délai juste mais faisable` }) }
    else { score -= 25; signals.push({ type: 'negative', text: `Seulement ${weeksUntilRace} sem. — minimum recommandé : ${minWeeks} sem.` }) }
  }

  const effectiveKm = data.kmPerWeekCustom || data.kmPerWeek
  const volMatrix = {
    '5K':      { '<30km': 5,   '30-50km': 10, '>50km': 10 },
    '10K':     { '<30km': -5,  '30-50km': 5,  '>50km': 10 },
    'Semi':    { '<30km': -20, '30-50km': 0,  '>50km': 10 },
    'Marathon':{ '<30km': -30, '30-50km': -10, '>50km': 15 },
  }
  const vs = volMatrix[data.distance]?.[data.kmPerWeek]
  if (vs !== undefined) {
    score += vs
    if (vs <= -20) signals.push({ type: 'negative', text: `Volume (${effectiveKm}) insuffisant pour un ${effectiveDist}` })
    else if (vs < 0) signals.push({ type: 'warning', text: `Volume (${effectiveKm}) un peu faible pour un ${effectiveDist}` })
    else if (vs >= 10) signals.push({ type: 'positive', text: `Volume bien adapté à l'objectif` })
  }

  if (data.targetTime && data.goal !== 'finish') {
    const targetMin = parseTimeToMin(data.targetTime)
    const targetKm = DIST_KM[data.distance]
    if (targetMin && targetKm) {
      let bestPrediction = null
      for (const rt of (data.refTimes || [])) {
        if (!rt.duration || !rt.distance) continue
        const refMin = parseTimeToMin(rt.duration)
        const refKm = rt.distance === 'Autre' ? parseFloat(rt.customDistance) : DIST_KM[rt.distance]
        if (!refMin || !refKm) continue
        if (refKm === targetKm) { bestPrediction = refMin; break }
        const predicted = riegel(refMin, refKm, targetKm)
        if (bestPrediction === null || predicted < bestPrediction) bestPrediction = predicted
      }
      if (bestPrediction) {
        const ratio = targetMin / bestPrediction
        const predStr = formatMin(bestPrediction)
        if (ratio < 0.88) { score -= 30; signals.push({ type: 'negative', text: `Objectif très ambitieux — niveau prédit ~${predStr}` }) }
        else if (ratio < 0.95) { score -= 12; signals.push({ type: 'warning', text: `Objectif ambitieux — niveau suggère ~${predStr}` }) }
        else if (ratio <= 1.05) { score += 8; signals.push({ type: 'positive', text: `Objectif cohérent avec tes chronos (~${predStr})` }) }
        else { score += 12; signals.push({ type: 'positive', text: `Objectif conservateur, tu as de la marge (~${predStr})` }) }
      }
    }
  }

  if (data.goal === 'finish') { score += 10; signals.push({ type: 'positive', text: 'Objectif finisher — le plus accessible' }) }

  score = Math.max(5, Math.min(100, score))
  if (score >= 75) return { score, label: 'Réaliste', tier: 'green', signals }
  if (score >= 55) return { score, label: 'Ambitieux', tier: 'indigo', signals }
  if (score >= 35) return { score, label: 'Très ambitieux', tier: 'amber', signals }
  return { score, label: 'Risqué', tier: 'red', signals }
}

// ── Main component ────────────────────────────

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [stravaConnected, setStravaConnected] = useState(null) // null=unknown, true/false
  const [fromResume, setFromResume] = useState(false)

  useEffect(() => {
    fetch('/api/strava/status').then(r => r.json()).then(d => setStravaConnected(d.connected)).catch(() => setStravaConnected(false))
  }, [])

  const [data, setData] = useState({
    // Step 0
    distance: '', customDistance: '', raceName: '', raceDate: '',
    // Step 1
    kmPerWeek: '', kmPerWeekCustom: '',
    experience: '', experienceCustom: '',
    enduranceSports: [], enduranceSportsCustom: '',
    // Step 2
    refTimes: [],
    // Step 3
    goal: '', targetTime: '',
    // Step 4
    sessionsPerWeek: null, sessionsCustom: '', showSessionsCustom: false,
    preferredDays: [],
    crossTrainingSports: [],
  })

  const set = (key, value) => setData(d => ({ ...d, [key]: value }))

  const toggleMulti = (key, value) =>
    setData(d => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter(x => x !== value) : [...d[key], value],
    }))

  const addRefTime = () =>
    setData(d => ({ ...d, refTimes: [...d.refTimes, { distance: '', customDistance: '', duration: '', date: '' }] }))

  const updateRefTime = (i, field, value) =>
    setData(d => ({
      ...d,
      refTimes: d.refTimes.map((r, idx) => idx === i ? { ...r, [field]: value } : r),
    }))

  const removeRefTime = (i) =>
    setData(d => ({ ...d, refTimes: d.refTimes.filter((_, idx) => idx !== i) }))

  // ── Derived ──────────────────────────────────

  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const dateTooSoon = weeksUntilRace !== null && weeksUntilRace < MIN_WEEKS_WARN

  const hasRefTimes = data.refTimes.some(r => r.duration?.trim())
  const isBeginnerExp = data.experience === '< 1 an' || (data.experience === '' && !data.experienceCustom)
  const isBeginnerDist = data.distance === '5K'
  const suggestFinish = !hasRefTimes || isBeginnerDist || isBeginnerExp

  const targetKm = DIST_KM[data.distance]
  let riegelPrediction = null
  let riegelSource = null
  if (targetKm && hasRefTimes) {
    for (const rt of data.refTimes) {
      if (!rt.duration || !rt.distance) continue
      const refMin = parseTimeToMin(rt.duration)
      const refKm = rt.distance === 'Autre' ? parseFloat(rt.customDistance) : DIST_KM[rt.distance]
      if (!refMin || !refKm) continue
      if (refKm === targetKm) {
        riegelPrediction = refMin
        riegelSource = { distance: rt.distance, date: rt.date }
        break
      }
      const pred = riegel(refMin, refKm, targetKm)
      if (riegelPrediction === null || pred < riegelPrediction) {
        riegelPrediction = pred
        riegelSource = { distance: rt.distance, date: rt.date }
      }
    }
  }

  const sessionsCount = data.sessionsPerWeek ?? (data.sessionsCustom ? parseInt(data.sessionsCustom) : null)
  const tooManySessions = sessionsCount !== null && sessionsCount > 7

  const confidence = computeConfidence(data)
  const isResume = step === STEPS.length

  // Plan calculated outputs for resume
  const PLAN_DURATIONS_FE = {
    '5K':      { debutant: [4, 6, 8],  intermediaire: [6, 7, 8],  avance: [4, 5, 6]  },
    '10K':     { debutant: [6, 8, 10], intermediaire: [8, 9, 10], avance: [6, 7, 8]  },
    'Semi':    { debutant: [10, 12, 14], intermediaire: [10, 11, 12], avance: [8, 9, 10] },
    'Marathon':{ debutant: [16, 18, 20], intermediaire: [16, 17, 18], avance: [12, 14, 16] },
  }
  const expLevel = !data.experience || data.experience === '< 1 an' ? 'debutant'
    : data.experience === '> 5 ans' ? 'avance' : 'intermediaire'
  const durRange = (PLAN_DURATIONS_FE[data.distance] || PLAN_DURATIONS_FE['10K'])[expLevel]
  const planWeeks = weeksUntilRace !== null
    ? Math.min(Math.max(weeksUntilRace, durRange[0]), durRange[2])
    : durRange[1]
  const planStart = new Date()
  const planEnd = data.raceDate ? new Date(data.raceDate) : null
  const baseKmWeek = parseFloat(data.kmPerWeekCustom) || (
    data.kmPerWeek === '<30km' ? 20 : data.kmPerWeek === '30-60km' ? 45 : data.kmPerWeek === '>60km' ? 70 : 30
  )
  const sessionsAvg = data.sessionsPerWeek ?? parseInt(data.sessionsCustom) ?? 3
  const weeklyVolumes = Array.from({ length: planWeeks }, (_, w) => {
    const isRecovery = (w + 1) % 4 === 0
    const phase = w < planWeeks * 0.35 ? 'fondation'
      : w < planWeeks * 0.65 ? 'developpement'
      : w < planWeeks * 0.85 ? 'affutage'
      : 'course'
    const volFactor = isRecovery ? 0.7
      : phase === 'fondation' ? (1 + w * 0.05)
      : phase === 'developpement' ? (1.2 + (w - planWeeks * 0.35) * 0.04)
      : phase === 'affutage' ? (1.3 - (w - planWeeks * 0.65) * 0.06)
      : 0.6
    return Math.round(baseKmWeek * volFactor)
  })
  const totalKm = weeklyVolumes.reduce((a, b) => a + b, 0)
  const avgKmWeek = Math.round(totalKm / planWeeks)

  // ── Navigation ────────────────────────────────

  const canNext = () => {
    if (step === 0) {
      const distOk = data.distance && (data.distance !== 'Autres' || (data.customDistance && parseFloat(data.customDistance) >= 1))
      return distOk && data.raceDate
    }
    if (step === 1) {
      const kmOk = data.kmPerWeek || data.kmPerWeekCustom
      const expOk = data.experience || data.experienceCustom
      return kmOk && expOk
    }
    if (step === 2) return true
    if (step === 3) return (data.sessionsPerWeek !== null || !!data.sessionsCustom) && data.preferredDays.length >= 2
    if (step === 4) return data.goal === 'guided' || (data.goal === 'time' && !!data.targetTime)
    return true
  }

  const goToStep = (n) => {
    if (n === 5) {
      // Skip tracker step if already connected
      const proceed = (connected) => {
        setStravaConnected(connected)
        setStep(connected ? STEPS.length : 5)
      }
      if (stravaConnected === null) {
        fetch('/api/strava/status').then(r => r.json()).then(d => proceed(d.connected)).catch(() => proceed(false))
      } else {
        proceed(stravaConnected)
      }
    } else {
      setStep(n)
    }
  }

  const goNext = () => {
    if (fromResume) {
      setFromResume(false)
      setStep(STEPS.length)
    } else {
      goToStep(step + 1)
    }
  }

  const editFromResume = (stepIndex) => {
    setFromResume(true)
    setStep(stepIndex)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setGenerateError(null)
    setElapsed(0)
    const timer = setInterval(() => setElapsed(s => s + 1), 1000)
    try {
      const payload = {
        distance: data.distance === 'Autres' ? (data.customDistance || 'Autre') : data.distance,
        raceName: data.raceName,
        raceDate: data.raceDate,
        kmPerWeek: data.kmPerWeekCustom ? `${data.kmPerWeekCustom}km` : data.kmPerWeek,
        longestRun: '',
        experience: data.experienceCustom || data.experience,
        refTimes: Object.fromEntries(
          data.refTimes
            .filter(r => r.distance && r.duration)
            .map(r => [r.distance === 'Autre' ? (r.customDistance || 'Autre') : r.distance, { time: r.duration, date: r.date }])
        ),
        goal: data.goal === 'guided' ? 'time' : data.goal,
        targetTime: data.targetTime || (data.goal === 'guided' ? (() => {
          // Fallback : temps typique selon distance + volume si pas de Riegel
          const dist = data.distance === 'Autres' ? null : data.distance
          const vol = parseFloat(data.kmPerWeekCustom) || (data.kmPerWeek === '<30km' ? 20 : data.kmPerWeek === '30-60km' ? 45 : data.kmPerWeek === '>60km' ? 70 : 25)
          const level = vol < 30 ? 'debutant' : vol <= 50 ? 'intermediaire' : 'avance'
          const DEFAULTS = {
            '5K':      { debutant: '35:00', intermediaire: '27:00', avance: '22:00' },
            '10K':     { debutant: '1h15:00', intermediaire: '52:00', avance: '42:00' },
            'Semi':    { debutant: '2h30:00', intermediaire: '1h50:00', avance: '1h30:00' },
            'Marathon':{ debutant: '5h00:00', intermediaire: '3h45:00', avance: '3h00:00' },
          }
          return dist && DEFAULTS[dist] ? DEFAULTS[dist][level] : ''
        })() : ''),
        sessionsPerWeek: data.sessionsPerWeek ?? (parseInt(data.sessionsCustom) || 3),
        preferredDays: data.preferredDays,
      }
      const res = await fetch('/api/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        router.push('/dashboard?tab=plan')
      } else {
        setGenerateError(json.error || 'Une erreur est survenue')
      }
    } catch (e) {
      setGenerateError(e.message || 'Erreur réseau')
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  // ── Header title ──────────────────────────────
  const stepTitle = isResume ? 'Récapitulatif' : STEPS[step]

  // ── Render ────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0faf5] flex flex-col font-sans">

      {/* Header */}
      <div className="bg-white border-b border-[#c5e6d5] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6">
          <div className="flex items-center justify-between py-3.5">
            <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <span className="text-[#02A257] font-black text-2xl tracking-tight">VITE</span>
            </Link>
            <div className="text-right">
              {!isResume ? (
                <span className="text-xs font-semibold text-[#282830]">
                  Étape <span className="text-[#02A257]">{step + 1}</span>
                  <span className="text-[#9ea0ae]"> / {STEPS.length}</span>
                  <span className="text-[#282830]"> · {stepTitle}</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#02A257]">Récapitulatif</span>
              )}
            </div>
          </div>
        </div>
        <div className="h-1 bg-[#ecf3df]">
          <div
            className="h-full bg-[#02A257] transition-all duration-500 ease-out"
            style={{ width: isResume ? '100%' : `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>


      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 pb-20">
        <div className="w-full max-w-lg">

          {/* ── STEP 0 — Course ── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quelle course prépares-tu ?" subtitle="Choisis la distance et la date de ta prochaine course." />

              {/* Distance */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Distance</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { value: '5K',       label: '5 km' },
                    { value: '10K',      label: '10 km' },
                    { value: 'Semi',     label: 'Semi-Marathon' },
                    { value: 'Marathon', label: 'Marathon' },
                    { value: 'Autres',   label: 'Autre' },
                  ].map(d => (
                    <OptionCard key={d.value} active={data.distance === d.value} onClick={() => set('distance', d.value)} label={d.label} />
                  ))}
                </div>
                {data.distance === 'Autres' && (
                  <div className="mt-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Distance en km, ex: 15"
                        value={data.customDistance}
                        onChange={e => set('customDistance', e.target.value)}
                        autoFocus
                        className="flex-1 bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-2xl px-4 py-3.5 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                      />
                      <span className="text-sm text-[#9ea0ae] flex-shrink-0 font-medium">km</span>
                    </div>
                    {data.customDistance && parseFloat(data.customDistance) < 1 && (
                      <p className="text-xs text-red-500 mt-1.5 pl-1">La distance doit être d'au moins 1 km.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Date */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Date</p>
                <input
                  type="date"
                  value={data.raceDate}
                  onChange={e => set('raceDate', e.target.value)}
                  className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-[#282830] focus:outline-none transition-colors shadow-sm ${
                    dateTooSoon ? 'border-amber-300 focus:border-amber-400' : 'border-[#c5e6d5] focus:border-[#02A257]'
                  }`}
                />
                {dateTooSoon && (
                  <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <AlertTriangle size={15} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="text-amber-700 text-sm font-semibold">Course très proche</p>
                      <p className="text-amber-600 text-xs mt-0.5 leading-relaxed">
                        Il reste {weeksUntilRace} semaine{weeksUntilRace !== 1 ? 's' : ''} — le plan sera intensif et adapté à ce délai court.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nom */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Nom <span className="normal-case font-normal text-[#c4c7d6]">(optionnel)</span></p>
                <input
                  type="text"
                  placeholder="ex: Marathon de Paris"
                  value={data.raceName}
                  onChange={e => set('raceName', e.target.value)}
                  className="w-full bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-2xl px-4 py-3.5 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── STEP 1 — Niveau ── */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quel est ton niveau ?" subtitle="Ces informations permettent de calibrer ton plan sur mesure." />

              {/* Volume */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Volume par semaine</p>
                <div className="grid grid-cols-3 gap-2">
                  {KM_WEEK_OPTIONS.map(o => (
                    <OptionCard key={o.value} active={data.kmPerWeek === o.value} onClick={() => { set('kmPerWeek', o.value); set('kmPerWeekCustom', '') }} label={o.label} />
                  ))}
                </div>
                {data.kmPerWeek === '>60km' && (
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="number"
                      placeholder="Volume exact"
                      value={data.kmPerWeekCustom}
                      onChange={e => set('kmPerWeekCustom', e.target.value)}
                      autoFocus
                      className="flex-1 bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                    />
                    <span className="text-sm text-[#9ea0ae] flex-shrink-0 font-medium">km / sem</span>
                  </div>
                )}
              </div>

              {/* Expérience */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Depuis combien de temps cours-tu ?</p>
                <div className="grid grid-cols-3 gap-2">
                  {EXPERIENCE_OPTIONS.map(o => (
                    <OptionCard key={o.value} active={data.experience === o.value} onClick={() => { set('experience', o.value); set('experienceCustom', '') }} label={o.label} />
                  ))}
                </div>
                {data.experience === '> 5 ans' && (
                  <input
                    type="text"
                    placeholder="Ou saisir exactement, ex: 10 ans, 6 mois…"
                    value={data.experienceCustom}
                    onChange={e => set('experienceCustom', e.target.value)}
                    autoFocus
                    className="mt-1 w-full bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                  />
                )}
              </div>

              {/* Sports d'endurance */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">
                  Pratiques-tu un autre sport d'endurance ?{' '}
                  <span className="normal-case font-normal text-[#c4c7d6]">(optionnel)</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ENDURANCE_SPORTS.map(s => (
                    <button
                      key={s.value}
                      onClick={() => toggleMulti('enduranceSports', s.value)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium text-left transition-all shadow-sm border ${
                        data.enduranceSports.includes(s.value)
                          ? 'border-[#02A257] bg-[#02A257]/5 text-[#02A257]'
                          : 'border-[#c5e6d5] bg-white text-[#464754] hover:border-[#02A257]/40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {data.enduranceSports.includes(s.value) && <Check size={12} strokeWidth={3} className="text-[#02A257]" />}
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
                {data.enduranceSports.includes('Autre') && (
                  <input
                    type="text"
                    placeholder="Précise le sport…"
                    value={data.enduranceSportsCustom}
                    onChange={e => set('enduranceSportsCustom', e.target.value)}
                    autoFocus
                    className="mt-1 w-full bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                  />
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 — Références ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="As-tu des chronos de référence ?" subtitle="Tes performances passées permettent de calibrer ton plan avec précision." />

              <div className="flex flex-col gap-3">
                {data.refTimes.map((rt, i) => {
                  const pace = calcPace(rt.duration, rt.distance, parseFloat(rt.customDistance))
                  const incoherent = rt.duration && rt.distance && !isChronoCoherent(rt.duration, rt.distance, parseFloat(rt.customDistance))
                  return (
                    <div key={i} className="bg-white border border-[#c5e6d5] rounded-2xl overflow-hidden shadow-sm">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#daf0e8]">
                        <select
                          value={rt.distance}
                          onChange={e => updateRefTime(i, 'distance', e.target.value)}
                          className="flex-1 bg-transparent text-sm font-semibold text-[#282830] focus:outline-none"
                        >
                          <option value="">Distance…</option>
                          {REF_DISTANCE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <button onClick={() => removeRefTime(i)} className="text-[#c4c7d6] hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {rt.distance === 'Autre' && (
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-[#daf0e8]">
                          <span className="text-xs text-[#9ea0ae] w-16 flex-shrink-0">Dist. (km)</span>
                          <input
                            type="number"
                            placeholder="ex: 15"
                            value={rt.customDistance}
                            onChange={e => updateRefTime(i, 'customDistance', e.target.value)}
                            className="flex-1 bg-transparent text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-4 px-4 py-3 border-b border-[#daf0e8]">
                        <span className="text-xs text-[#9ea0ae] w-16 flex-shrink-0">Temps</span>
                        <input
                          type="text"
                          placeholder="ex: 45:30 · 1h52:00"
                          value={rt.duration}
                          onChange={e => updateRefTime(i, 'duration', e.target.value)}
                          className="flex-1 bg-transparent text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none"
                        />
                        {pace && (
                          <span className="text-xs font-semibold text-[#02A257] bg-[#02A257]/8 px-2 py-1 rounded-lg flex-shrink-0">
                            {pace}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 px-4 py-3 bg-[#f7faf0]">
                        <span className="text-xs text-[#9ea0ae] w-16 flex-shrink-0">Date</span>
                        <input
                          type="date"
                          value={rt.date}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={e => updateRefTime(i, 'date', e.target.value)}
                          className="flex-1 bg-transparent text-xs text-[#464754] focus:outline-none"
                        />
                      </div>
                      {incoherent && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-t border-amber-100">
                          <AlertTriangle size={13} className="text-amber-500 flex-shrink-0" />
                          <p className="text-xs text-amber-600">Ce chrono semble incohérent avec la distance — vérifie le format.</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <button
                onClick={addRefTime}
                className="flex items-center gap-2 text-sm font-semibold text-[#02A257] hover:text-[#018f4c] transition-colors py-1 w-fit"
              >
                <Plus size={16} strokeWidth={2.5} />
                Ajouter un chrono
              </button>
            </div>
          )}

          {/* ── STEP 3 — Dispo ── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quelle est ta disponibilité ?" subtitle="On adapte le volume à ton emploi du temps." />

              {/* Recommandation */}
              {SESSION_HINTS[data.distance] && (
                <div className="flex gap-3 bg-[#f0faf5] border border-[#c5e6d5] rounded-2xl p-4">
                  <TrendingUp size={15} className="text-[#02A257] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[#656779] text-sm">{SESSION_HINTS[data.distance]}</p>
                </div>
              )}

              {/* Séances par semaine */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">Séances par semaine</p>
                <div className="flex gap-2 flex-wrap">
                  {[3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => { set('sessionsPerWeek', n); set('sessionsCustom', ''); set('showSessionsCustom', false) }}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                        data.sessionsPerWeek === n
                          ? 'border-[#02A257] bg-[#02A257] text-white'
                          : 'border-[#c5e6d5] bg-white text-[#464754] hover:border-[#02A257]/50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => { set('showSessionsCustom', true); set('sessionsPerWeek', null) }}
                    className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                      data.showSessionsCustom
                        ? 'border-[#02A257] bg-[#02A257]/5 text-[#02A257]'
                        : 'border-[#c5e6d5] bg-white text-[#9ea0ae] hover:border-[#02A257]/50'
                    }`}
                  >
                    +
                  </button>
                </div>
                {data.showSessionsCustom && (
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="number"
                      placeholder="Nombre de séances"
                      value={data.sessionsCustom}
                      onChange={e => { set('sessionsCustom', e.target.value); set('sessionsPerWeek', null) }}
                      autoFocus
                      className="flex-1 bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors"
                    />
                    <span className="text-sm text-[#9ea0ae] flex-shrink-0 font-medium">séances / sem</span>
                  </div>
                )}
                {tooManySessions && (
                  <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-1">
                    <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-600 leading-relaxed">Au-delà de 7 séances par semaine, le risque de blessure augmente significativement.</p>
                  </div>
                )}
              </div>

              {/* Jours préférés */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">
                  Jours préférés <span className="normal-case font-normal text-[#c4c7d6]">(minimum 2)</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleMulti('preferredDays', day)}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                        data.preferredDays.includes(day)
                          ? 'bg-[#02A257] text-white'
                          : 'bg-white border border-[#c5e6d5] text-[#464754] hover:border-[#02A257]/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cross-training */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest pl-1">
                  Veux-tu inclure d'autres sports dans le plan ? <span className="normal-case font-normal text-[#c4c7d6]">(optionnel)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {['Cyclisme', 'Natation', 'Renforcement musculaire'].map(sport => (
                    <button
                      key={sport}
                      onClick={() => toggleMulti('crossTrainingSports', sport)}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all shadow-sm border text-center ${
                        data.crossTrainingSports.includes(sport)
                          ? 'border-[#02A257] bg-[#02A257]/8 text-[#02A257]'
                          : 'border-[#c5e6d5] bg-white text-[#464754] hover:border-[#02A257]/50'
                      }`}
                    >
                      {sport}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4 — Objectif ── */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <StepHeader
                title="Quel est ton objectif de chrono ?"
                subtitle={`${data.raceName || (data.distance === 'Autres' ? data.customDistance + ' km' : data.distance)}${data.raceDate ? ` · ${new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}`}
              />

              {/* Tips */}
              {suggestFinish ? (
                <div className="flex gap-3 bg-[#f0faf5] border border-[#c5e6d5] rounded-2xl p-4">
                  <TrendingUp size={15} className="text-[#02A257] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <div>
                    <p className="text-[#282830] text-sm font-semibold">Pas encore de chrono ? Commence par finir</p>
                    <p className="text-[#656779] text-xs mt-0.5 leading-relaxed">
                      {!hasRefTimes ? 'Sans chrono de référence, ' : isBeginnerDist ? 'Pour un 5K, ' : "Avec moins d'1 an d'expérience, "}
                      le plan sera calé sur l'allure de course et tu ajusteras au fil des séances.
                    </p>
                  </div>
                </div>
              ) : riegelPrediction ? (
                <div className="flex gap-3 bg-[#f0faf5] border border-[#c5e6d5] rounded-2xl p-4">
                  <TrendingUp size={15} className="text-[#02A257] flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[#656779] text-sm">
                    D'après tes chronos, on estime ton niveau à <span className="font-semibold text-[#02A257]">{formatMin(riegelPrediction)}</span> sur {data.distance === 'Autres' ? data.customDistance + ' km' : data.distance}.
                  </p>
                </div>
              ) : null}

              {/* Goal buttons */}
              <div className="flex flex-col gap-3">
                <OptionCard
                  active={data.goal === 'time'}
                  onClick={() => { set('goal', 'time'); set('targetTime', '') }}
                  label="Objectif de temps"
                  desc="Je connais mon chrono cible et je veux m'entraîner dessus"
                  horizontal
                />
                <OptionCard
                  active={data.goal === 'guided'}
                  onClick={() => {
                    set('goal', 'guided')
                    if (riegelPrediction) set('targetTime', formatMin(riegelPrediction))
                  }}
                  label="Je ne sais pas, guide moi"
                  desc="VITE calcule un objectif réaliste d'après ton profil"
                  horizontal
                />
              </div>

              {/* Target time input */}
              {(data.goal === 'time' || data.goal === 'guided') && (
                <div className="flex flex-col gap-3">
                  <Label>Ton chrono cible</Label>
                  {data.goal === 'guided' && riegelPrediction && (
                    <div className="flex items-center gap-3 bg-[#02A257]/5 border border-[#02A257]/20 rounded-xl px-4 py-3">
                      <TrendingUp size={14} className="text-[#02A257] flex-shrink-0" strokeWidth={2} />
                      <p className="text-xs text-[#656779] leading-relaxed flex-1">
                        Suggestion basée sur ton {riegelSource?.distance}
                        {riegelSource?.date ? ` de ${new Date(riegelSource.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : ''}.
                        Modifie si besoin.
                      </p>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder={data.distance === 'Marathon' ? 'ex: 3h45:00' : data.distance === 'Semi' ? 'ex: 1h50:00' : 'ex: 52:00'}
                    value={data.targetTime}
                    onChange={e => set('targetTime', e.target.value)}
                    className="w-full bg-white border-2 border-[#02A257] rounded-2xl px-4 py-4 text-lg font-bold text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm tracking-wide"
                    autoFocus
                  />
                  <p className="text-xs text-[#9ea0ae] pl-1">Ce chrono guidera l'intensité de chaque séance.</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5 — Tracker ── */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Suis tes séances automatiquement" subtitle="Connecte ton tracker pour valider tes séances dès que tu cours — 0 saisie manuelle." />

              {stravaConnected ? (
                <>
                  <div className="flex gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                    <Check size={15} className="text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div>
                      <p className="text-emerald-700 text-sm font-semibold">Strava déjà connecté</p>
                      <p className="text-emerald-600 text-xs mt-0.5 leading-relaxed">Tes activités se synchronisent automatiquement — tu n'as rien à faire.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-5 bg-white border border-emerald-200 rounded-2xl shadow-sm">
                    <div className="w-11 h-11 rounded-xl bg-[#FC4C02] flex items-center justify-center flex-shrink-0">
                      <StravaIcon />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#282830]">Strava</div>
                      <div className="text-xs text-emerald-600 mt-0.5 font-medium">● Connecté et actif</div>
                    </div>
                    <Check size={18} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-3 bg-[#f0faf5] border border-[#c5e6d5] rounded-2xl p-4">
                    <Check size={15} className="text-[#02A257] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <p className="text-sm text-[#656779] leading-relaxed">
                      En connectant ton tracker, tes sorties sont synchronisées automatiquement et chaque séance est validée en temps réel.
                    </p>
                  </div>
                  <a
                    href="/api/auth/strava"
                    className="flex items-center gap-4 p-5 bg-white border border-[#c5e6d5] rounded-2xl shadow-sm hover:border-[#FC4C02]/50 hover:shadow-md transition-all group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FC4C02] flex items-center justify-center flex-shrink-0">
                      <StravaIcon />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-[#282830]">Connecter Strava</div>
                      <div className="text-xs text-[#656779] mt-0.5">Sync automatique de tes activités</div>
                    </div>
                    <span className="text-[#c4c7d6] group-hover:text-[#FC4C02] transition-colors text-lg">→</span>
                  </a>
                </>
              )}
              <div className="flex items-center gap-4 p-5 bg-white border border-[#c5e6d5] rounded-2xl shadow-sm opacity-50 pointer-events-none select-none">
                <div className="w-11 h-11 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ea0ae" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#282830]">Garmin · Apple Watch</div>
                  <div className="text-xs text-[#656779] mt-0.5">Connecte ta montre directement</div>
                </div>
                <span className="text-xs font-semibold bg-[#f0faf5] text-[#9ea0ae] border border-[#c5e6d5] px-2.5 py-1 rounded-full">Bientôt</span>
              </div>

            </div>
          )}

          {/* ── RÉSUMÉ ── */}
          {isResume && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Tout est prêt" subtitle="Vérifie tes paramètres avant de générer ton plan." />

              {/* Hero : chrono cible */}
              <div className="bg-[#02A257] rounded-2xl px-6 py-5 text-white shadow-sm text-center">
                <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">
                  {data.distance === 'Autres' ? data.customDistance + ' km' : data.distance}
                  {data.raceName ? ` · ${data.raceName}` : ''}
                </p>
                <p className="text-4xl font-black tracking-tight">
                  {data.targetTime || 'Finisher'}
                </p>
                {data.raceDate && (
                  <p className="text-xs opacity-60 mt-1.5">
                    {new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Plan overview card */}
              <div className="bg-white border border-[#c5e6d5] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                {/* Duration + sessions */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[#9ea0ae] font-semibold uppercase tracking-wide">Durée du plan</p>
                    <p className="text-2xl font-bold text-[#282830] mt-0.5">{planWeeks} semaines</p>
                    {planEnd && (
                      <p className="text-xs text-[#9ea0ae] mt-0.5">
                        {planStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} → {planEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#9ea0ae] font-semibold uppercase tracking-wide">Séances / sem</p>
                    <p className="text-2xl font-bold text-[#282830] mt-0.5">{sessionsAvg}</p>
                  </div>
                </div>

                {/* Phases chart */}
                <div>
                  <p className="text-xs text-[#9ea0ae] font-semibold uppercase tracking-wide mb-2">Phases du plan</p>
                  <PhasesChart weeks={planWeeks} baseKm={baseKmWeek} />
                </div>

                {/* Volume stats */}
                <div className="flex gap-6 pt-3 border-t border-[#daf0e8]">
                  <div>
                    <p className="text-xs text-[#9ea0ae] font-medium">Volume total estimé</p>
                    <p className="text-base font-bold text-[#282830] mt-0.5">~{totalKm} km</p>
                  </div>
                  <div className="w-px bg-[#daf0e8]" />
                  <div>
                    <p className="text-xs text-[#9ea0ae] font-medium">Moy. par semaine</p>
                    <p className="text-base font-bold text-[#282830] mt-0.5">~{avgKmWeek} km</p>
                  </div>
                </div>
              </div>

              {/* Summary rows */}
              <div className="bg-white border border-[#c5e6d5] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#daf0e8]">
                <SummaryRow label="Course" value={`${data.distance === 'Autres' ? (data.customDistance + ' km') : data.distance}${data.raceName ? ` — ${data.raceName}` : ''}`} onEdit={() => editFromResume(0)} />
                <SummaryRow label="Date" value={data.raceDate ? new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} onEdit={() => editFromResume(0)} />
                <SummaryRow label="Volume" value={data.kmPerWeekCustom ? `${data.kmPerWeekCustom} km/sem` : data.kmPerWeek} onEdit={() => editFromResume(1)} />
                <SummaryRow label="Expérience" value={data.experienceCustom || data.experience || '—'} onEdit={() => editFromResume(1)} />
                {hasRefTimes && (
                  <SummaryRow
                    label="Références"
                    value={data.refTimes.filter(r => r.duration).map(r => {
                      const pace = calcPace(r.duration, r.distance, parseFloat(r.customDistance))
                      return `${r.distance === 'Autre' ? r.customDistance + 'km' : r.distance} ${r.duration}${pace ? ` (${pace})` : ''}`
                    }).join(' · ')}
                    onEdit={() => editFromResume(2)}
                  />
                )}
                <SummaryRow label="Séances" value={`${data.sessionsPerWeek ?? data.sessionsCustom}/sem · ${data.preferredDays.join(', ')}`} onEdit={() => editFromResume(3)} />
                <SummaryRow label="Objectif" value={data.targetTime ? `Chrono : ${data.targetTime}` : 'Finisher'} onEdit={() => editFromResume(4)} />
              </div>

              <ConfidenceIndicator confidence={confidence} />

              {generateError && (
                <div className="flex gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 text-sm font-semibold">Erreur lors de la génération</p>
                    <p className="text-red-500 text-xs mt-0.5">{generateError}</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="bg-[#f0faf5] border border-[#c5e6d5] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#282830]">Claude génère ton plan…</span>
                    <span className="text-xs font-mono text-[#02A257] font-bold">{elapsed}s</span>
                  </div>
                  <div className="h-1.5 bg-[#c5e6d5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#02A257] rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((elapsed / 35) * 100, 95)}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#9ea0ae] mt-2">
                    {elapsed < 5 ? 'Analyse de ton profil…'
                      : elapsed < 12 ? 'Construction des semaines de préparation…'
                      : elapsed < 20 ? 'Calibrage des allures et intensités…'
                      : elapsed < 28 ? 'Finalisation du plan…'
                      : 'Presque prêt…'}
                  </p>
                </div>
              )}

              {!loading && !generateError && (
                <p className="text-xs text-[#c4c7d6] text-center leading-relaxed">
                  Le plan sera généré par IA et s'adaptera au fil de tes sorties.
                </p>
              )}
            </div>
          )}

          {/* ── Navigation ── */}
          <div className="flex gap-3 mt-8">
            {(step > 0 || isResume) && (
              <button
                onClick={() => {
                  if (isResume) {
                    // If tracker was skipped (Strava connected), go back to Objectif (step 4)
                    setStep(stravaConnected ? STEPS.length - 2 : STEPS.length - 1)
                  } else {
                    setStep(s => s - 1)
                  }
                }}
                className="flex-1 py-3.5 rounded-2xl border border-[#c5e6d5] bg-white text-sm text-[#656779] hover:text-[#282830] hover:border-[#02A257]/30 transition-all font-medium shadow-sm"
              >
                {isResume ? 'Modifier' : 'Retour'}
              </button>
            )}

            {!isResume ? (
              <button
                onClick={goNext}
                disabled={!canNext()}
                className="flex-1 py-3.5 rounded-2xl bg-[#02A257] hover:bg-[#018f4c] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === 2 && !hasRefTimes ? 'Passer cette étape'
                  : step === 0 && dateTooSoon ? 'Continuer quand même'
                  : fromResume ? 'Retour au résumé'
                  : step === STEPS.length - 1 ? 'Voir le résumé'
                  : 'Continuer'}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-[#02A257] hover:bg-[#018f4c] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Génération en cours…
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    Générer mon plan <Sparkles size={14} strokeWidth={2} />
                  </span>
                )}
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}

// ── Sub-components ────────────────────────────

function StepHeader({ title, subtitle }) {
  return (
    <div className="mb-1">
      <h1 className="text-2xl font-bold text-[#282830] tracking-tight mb-1.5 leading-snug">{title}</h1>
      <p className="text-[#656779] text-sm leading-relaxed">{subtitle}</p>
    </div>
  )
}

function Label({ children }) {
  return <p className="text-xs text-[#9ea0ae] mb-2.5 font-semibold uppercase tracking-wider">{children}</p>
}

function OptionCard({ active, onClick, label, desc, horizontal }) {
  if (horizontal) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all shadow-sm ${
          active ? 'border-[#02A257] bg-[#02A257]/5' : 'border-[#c5e6d5] bg-white hover:border-[#02A257]/40'
        }`}
      >
        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'border-[#02A257] bg-[#02A257]' : 'border-[#c4c7d6]'}`}>
          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <div className={`text-sm font-semibold transition-colors ${active ? 'text-[#02A257]' : 'text-[#282830]'}`}>{label}</div>
          {desc && <div className="text-xs text-[#656779] mt-0.5 leading-relaxed">{desc}</div>}
        </div>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-3 sm:p-4 rounded-2xl border text-left transition-all shadow-sm ${
        active ? 'border-[#02A257] bg-[#02A257]/5' : 'border-[#c5e6d5] bg-white hover:border-[#02A257]/40'
      }`}
    >
      <div className={`text-sm font-semibold transition-colors ${active ? 'text-[#02A257]' : 'text-[#282830]'}`}>{label}</div>
      {desc && <div className="text-xs text-[#9ea0ae] mt-1 leading-snug">{desc}</div>}
    </button>
  )
}

function PhasesChart({ weeks, baseKm }) {
  const PHASE_COLORS = {
    fondation: '#a7d9c0',
    developpement: '#02A257',
    affutage: '#018f4c',
    course: '#fb923c',
  }
  const PHASE_LABELS = {
    fondation: 'Fondation',
    developpement: 'Développement',
    affutage: 'Affûtage',
    course: 'Course',
  }

  const bars = Array.from({ length: weeks }, (_, w) => {
    const isRecovery = (w + 1) % 4 === 0
    const phase = w < weeks * 0.35 ? 'fondation'
      : w < weeks * 0.65 ? 'developpement'
      : w < weeks * 0.85 ? 'affutage'
      : 'course'
    const volFactor = isRecovery ? 0.7
      : phase === 'fondation' ? (1 + w * 0.05)
      : phase === 'developpement' ? (1.2 + (w - weeks * 0.35) * 0.04)
      : phase === 'affutage' ? (1.3 - (w - weeks * 0.65) * 0.06)
      : 0.6
    return { phase, volFactor: Math.min(volFactor, 2), isRecovery }
  })

  const maxFactor = Math.max(...bars.map(b => b.volFactor))
  const visiblePhases = [...new Set(bars.map(b => b.phase))]

  return (
    <div>
      <div className="flex items-end gap-0.5 h-14">
        {bars.map((bar, i) => (
          <div
            key={i}
            style={{
              height: `${(bar.volFactor / maxFactor) * 100}%`,
              backgroundColor: PHASE_COLORS[bar.phase],
              opacity: bar.isRecovery ? 0.45 : 1,
              flex: 1,
              borderRadius: '2px 2px 0 0',
            }}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {visiblePhases.map(phase => (
          <div key={phase} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: PHASE_COLORS[phase] }} />
            <span className="text-xs text-[#9ea0ae]">{PHASE_LABELS[phase]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StravaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

function SummaryRow({ label, value, onEdit }) {
  return (
    <div
      className={`flex items-start justify-between gap-4 px-5 py-3.5 group ${onEdit ? 'cursor-pointer hover:bg-[#f7faf0] transition-colors' : ''}`}
      onClick={onEdit}
    >
      <span className="text-xs text-[#9ea0ae] uppercase tracking-wide font-semibold flex-shrink-0 mt-0.5">{label}</span>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-[#282830] text-right font-medium truncate">{value}</span>
        {onEdit && <Pencil size={11} className="text-[#c4c7d6] group-hover:text-[#02A257] transition-colors flex-shrink-0" />}
      </div>
    </div>
  )
}

const TIER_STYLES = {
  green:  { bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', Icon: Check, iconBg: 'bg-emerald-500' },
  indigo: { bar: 'bg-[#02A257]', bg: 'bg-[#02A257]/5', border: 'border-[#02A257]/20', badge: 'bg-[#02A257]/10 text-[#02A257]', Icon: TrendingUp, iconBg: 'bg-[#02A257]' },
  amber:  { bar: 'bg-amber-400', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', Icon: AlertCircle, iconBg: 'bg-amber-400' },
  red:    { bar: 'bg-red-400', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-600', Icon: X, iconBg: 'bg-red-400' },
}

const SIGNAL_STYLES = {
  positive: { Icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  warning:  { Icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-400' },
  negative: { Icon: X, color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-400' },
}

function ConfidenceIndicator({ confidence }) {
  const { score, label, tier, signals } = confidence
  const style = TIER_STYLES[tier]
  const TierIcon = style.Icon

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-sm ${style.border} ${style.bg}`}>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-xs text-[#9ea0ae] uppercase tracking-wide font-semibold mb-1">Indice de confiance</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#282830]">{label}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>{score} / 100</span>
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.iconBg}`}>
          <TierIcon size={18} color="white" strokeWidth={2.5} />
        </div>
      </div>
      <div className="h-1.5 bg-white/60 mx-5 mb-4 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${style.bar}`} style={{ width: `${score}%` }} />
      </div>
      {signals.length > 0 && (
        <div className="flex flex-col gap-2 px-5 pb-4">
          {signals.map((s, i) => {
            const ss = SIGNAL_STYLES[s.type]
            const SigIcon = ss.Icon
            return (
              <div key={i} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 ${ss.bg}`}>
                <div className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${ss.dot}`}>
                  <SigIcon size={10} color="white" strokeWidth={3} />
                </div>
                <span className={`text-xs leading-relaxed font-medium ${ss.color}`}>{s.text}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

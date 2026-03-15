'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { AlertTriangle, Check, TrendingUp, AlertCircle, X, Sparkles, Plus, Trash2, Pencil, Flag, Zap, Clock } from 'lucide-react'

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

function getRefTimeDuration(rt) {
  const h = rt.hours || ''
  const m = rt.minutes || ''
  const s = rt.seconds || ''
  if (!h && !m && !s) return ''
  return [h ? `${h}h` : '', m ? m.padStart(2, '0') : '00', ':', s ? s.padStart(2, '0') : '00'].join('')
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

function computeConfidence(data, planWeeks) {
  let score = 70
  const signals = []

  const effectiveDist = data.distance === 'Autres' ? (data.customDistance || 'Autre') : data.distance
  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const minWeeks = MIN_WEEKS_PLAN[data.distance] || 4

  if (weeksUntilRace !== null) {
    const ratio = weeksUntilRace / (minWeeks || 1)
    if (ratio >= 2) { score += 15; signals.push({ type: 'positive', text: `${planWeeks} semaines de préparation — tu as tout le temps qu'il faut.` }) }
    else if (ratio >= 1.3) { score += 5; signals.push({ type: 'positive', text: `${planWeeks} semaines, c'est une bonne marge pour progresser sereinement.` }) }
    else if (ratio >= 1) { signals.push({ type: 'warning', text: `${planWeeks} semaines, c'est juste — mais faisable avec de la régularité.` }) }
    else { score -= 25; signals.push({ type: 'negative', text: `${planWeeks} sem. de plan — idéalement il en faudrait ${minWeeks}. Le plan sera intensif.` }) }
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
    if (vs <= -20) signals.push({ type: 'negative', text: `Ton volume actuel (${effectiveKm}) est trop faible pour un ${effectiveDist} — il faudra progresser vite.` })
    else if (vs < 0) signals.push({ type: 'warning', text: `Ton volume (${effectiveKm}) est un peu léger pour un ${effectiveDist} — on va monter en charge progressivement.` })
    else if (vs >= 10) signals.push({ type: 'positive', text: `Ton volume d'entraînement est bien en phase avec ton objectif.` })
  }

  if (data.targetTime && data.goal !== 'finish') {
    const targetMin = parseTimeToMin(data.targetTime)
    const targetKm = DIST_KM[data.distance]
    if (targetMin && targetKm) {
      let bestPrediction = null
      for (const rt of (data.refTimes || [])) {
        const rtDur = getRefTimeDuration(rt)
        if (!rtDur || !rt.distance) continue
        const refMin = parseTimeToMin(rtDur)
        const refKm = rt.distance === 'Autre' ? parseFloat(rt.customDistance) : DIST_KM[rt.distance]
        if (!refMin || !refKm) continue
        if (refKm === targetKm) { bestPrediction = refMin; break }
        const predicted = riegel(refMin, refKm, targetKm)
        if (bestPrediction === null || predicted < bestPrediction) bestPrediction = predicted
      }
      if (bestPrediction) {
        const ratio = targetMin / bestPrediction
        const predStr = formatMin(bestPrediction)
        if (ratio < 0.88) { score -= 30; signals.push({ type: 'negative', text: `Ton objectif est très ambitieux — d'après tes chronos, ton niveau actuel est plutôt autour de ~${predStr}.` }) }
        else if (ratio < 0.95) { score -= 12; signals.push({ type: 'warning', text: `Objectif ambitieux mais atteignable — tes chronos suggèrent ~${predStr}. Il faudra être constant.` }) }
        else if (ratio <= 1.05) { score += 8; signals.push({ type: 'positive', text: `Ton objectif est cohérent avec tes chronos — le plan est calé sur ~${predStr}.` }) }
        else { score += 12; signals.push({ type: 'positive', text: `Objectif conservateur, tu as de la marge (~${predStr}) — parfait pour progresser sans te blesser.` }) }
      }
    }
  }

  if (data.goal === 'finish') { score += 10; signals.push({ type: 'positive', text: 'Objectif finisher — le plan est conçu pour t\'amener à la ligne d\'arrivée en forme.' }) }

  score = Math.max(5, Math.min(100, score))
  if (score >= 75) return { score, label: 'Réaliste', tier: 'green', signals }
  if (score >= 55) return { score, label: 'Ambitieux', tier: 'indigo', signals }
  if (score >= 35) return { score, label: 'Très ambitieux', tier: 'amber', signals }
  return { score, label: 'Risqué', tier: 'red', signals }
}

// ── Main component ────────────────────────────

function OnboardingInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [stravaConnected, setStravaConnected] = useState(null) // null=unknown, true/false
  const [fromResume, setFromResume] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [startModalOpen, setStartModalOpen] = useState(false)
  const [planStartDate, setPlanStartDate] = useState('')
  const [vitePlusOpen, setVitePlusOpen] = useState(false)
  const [vitePlusData, setVitePlusData] = useState({
    fcMax: '', fcRepos: '', vo2max: '', vfc: '', spo2: '', ftpVelo: '',
    poids: '', taille: '', sexe: '',
    chaussuresModele: '', chaussureMarque: '',
  })

  useEffect(() => {
    fetch('/api/strava/status').then(r => r.json()).then(d => setStravaConnected(d.connected)).catch(() => setStravaConnected(false))
  }, [])

  const validDistances = ['5K', '10K', 'Semi', 'Marathon']
  const distanceParam = searchParams.get('distance')
  const [data, setData] = useState({
    // Step 0
    distance: validDistances.includes(distanceParam) ? distanceParam : '', customDistance: '', raceName: '', raceDate: '',
    // Step 1
    kmPerWeek: '', kmPerWeekCustom: '',
    experience: '', experienceCustom: '',
    enduranceSports: [], enduranceSportsCustom: '',
    // Step 2
    hasChronos: null,
    refTimes: [],
    // Step 3
    goal: '', targetTime: '', targetHours: '', targetMinutes: '', targetSeconds: '',
    // Step 4
    sessionsPerWeek: null, sessionsCustom: '', showSessionsCustom: false,
    preferredDays: [],
    crossTrainingSports: [],
  })

  const set = (key, value) => setData(d => ({ ...d, [key]: value }))

  const setTargetTime = (h, m, s) => {
    const dur = [h ? `${h}h` : '', m ? m.padStart(2, '0') : '00', ':', s ? s.padStart(2, '0') : '00'].join('')
    setData(d => ({ ...d, targetHours: h, targetMinutes: m, targetSeconds: s, targetTime: dur }))
  }

  const toggleMulti = (key, value) =>
    setData(d => ({
      ...d,
      [key]: d[key].includes(value) ? d[key].filter(x => x !== value) : [...d[key], value],
    }))

  const addRefTime = () =>
    setData(d => ({ ...d, refTimes: [...d.refTimes, { distance: '', customDistance: '', hours: '', minutes: '', seconds: '', date: '' }] }))

  useEffect(() => {
    if (step === 2 && data.hasChronos === true && data.refTimes.length === 0) {
      addRefTime()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data.hasChronos])

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

  const hasRefTimes = data.refTimes.some(r => getRefTimeDuration(r) && getRefTimeDuration(r) !== '00:00')
  const isBeginnerExp = data.experience === '< 1 an' || (data.experience === '' && !data.experienceCustom)
  const isBeginnerDist = data.distance === '5K'
  const suggestFinish = !hasRefTimes || isBeginnerDist || isBeginnerExp

  const targetKm = DIST_KM[data.distance]
  let riegelPrediction = null
  let riegelSource = null
  if (targetKm && hasRefTimes) {
    for (const rt of data.refTimes) {
      const rtDuration = getRefTimeDuration(rt)
      if (!rtDuration || !rt.distance) continue
      const refMin = parseTimeToMin(rtDuration)
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

  const confidence = computeConfidence(data, planWeeks)
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
    if (step === 4) return data.goal === 'finish' || data.goal === 'guided' || (data.goal === 'time' && !!data.targetTime)
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
        startDate: planStartDate || new Date().toISOString().split('T')[0],
        kmPerWeek: data.kmPerWeekCustom ? `${data.kmPerWeekCustom}km` : data.kmPerWeek,
        longestRun: '',
        experience: data.experienceCustom || data.experience,
        refTimes: Object.fromEntries(
          data.refTimes
            .map(r => ({ ...r, duration: getRefTimeDuration(r) }))
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
        const hasAdvanced = Object.values(vitePlusData).some(v => v !== '' && v !== null)
        if (hasAdvanced) {
          fetch('/api/profile/advanced', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vitePlusData),
          }).catch(() => {})
        }
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
          <div style={{ display: 'flex', alignItems: 'center', height: '52px', position: 'relative' }}>
            <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
              <span className="text-[#02A257] font-black text-2xl tracking-tight">VITE</span>
            </Link>
            <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              {STEPS.map((_, i) => {
                const isPast = isResume || i < step
                const isCurrent = i === step && !isResume
                return (
                  <div
                    key={i}
                    style={{
                      width: isCurrent ? '36px' : '9px',
                      height: '9px',
                      borderRadius: '99px',
                      background: isCurrent ? '#02A257' : isPast ? '#02A257' : '#c5e6d5',
                      transition: 'all 0.3s ease',
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 py-6 pb-20">
        <div className="w-full max-w-lg">

          {/* ── STEP 0 — Course ── */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <StepHeader
                title="Quelle course prépares-tu ?"
                subtitle="Choisis la distance et la date de ta prochaine course."
                icon={
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      {/* Ligne d'arrivée */}
                      <line x1="6" y1="28" x2="30" y2="28" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      {/* Drapeau */}
                      <line x1="10" y1="8" x2="10" y2="28" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M10 8 L24 12 L10 16 Z" fill="#02A257"/>
                      {/* Coureur simplifié */}
                      <circle cx="26" cy="14" r="2.5" fill="#02A257"/>
                      <path d="M26 17 L26 23 M26 23 L23 28 M26 23 L29 28 M23 19 L29 19" stroke="#02A257" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                }
              />

              {/* Distance */}
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { value: '5K',       label: '5K',        km: '5 km',      desc: 'Idéal pour débuter' },
                    { value: '10K',      label: '10K',       km: '10 km',     desc: 'Le classique' },
                    { value: 'Semi',     label: 'Semi',      km: '21,1 km',   desc: 'Le beau défi' },
                    { value: 'Marathon', label: 'Marathon',  km: '42,2 km',   desc: 'Le graal' },
                  ].map(d => (
                    <button
                      key={d.value}
                      onClick={() => set('distance', d.value)}
                      style={{
                        padding: '1rem', borderRadius: '16px', border: '2px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                        background: data.distance === d.value ? '#02A257' : 'white',
                        borderColor: data.distance === d.value ? '#02A257' : '#e8e8e8',
                      }}
                    >
                      <div style={{ fontSize: '1.3rem', fontWeight: '900', color: data.distance === d.value ? 'white' : '#282830', letterSpacing: '-0.02em', marginBottom: '0.2rem' }}>{d.label}</div>
                      <div style={{ fontSize: '0.72rem', color: data.distance === d.value ? 'rgba(255,255,255,0.65)' : '#b0b3c1' }}>{d.desc}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => set('distance', 'Autres')}
                  style={{
                    width: '100%', padding: '0.75rem', borderRadius: '12px', border: '2px solid', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                    background: data.distance === 'Autres' ? '#02A257' : 'white',
                    borderColor: data.distance === 'Autres' ? '#02A257' : '#e8e8e8',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: data.distance === 'Autres' ? 'white' : '#9ea0ae' }}>Autre distance</span>
                </button>
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
              <StepHeader
                title="Quel est ton niveau ?"
                subtitle="Ces informations permettent de calibrer ton plan sur mesure."
                icon={
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      {/* Barres de progression croissantes */}
                      <rect x="5" y="22" width="6" height="8" rx="2" fill="#c5e6d5"/>
                      <rect x="15" y="16" width="6" height="14" rx="2" fill="#02A257" opacity="0.5"/>
                      <rect x="25" y="8" width="6" height="22" rx="2" fill="#02A257"/>
                    </svg>
                  </div>
                }
              />

              {/* Volume */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest">Volume par semaine</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '<30km',   label: '< 30 km',   desc: 'Débutant' },
                    { value: '30-60km', label: '30–60 km',  desc: 'Régulier' },
                    { value: '>60km',   label: '> 60 km',   desc: 'Avancé' },
                  ].map(o => (
                    <button key={o.value} onClick={() => { set('kmPerWeek', o.value); set('kmPerWeekCustom', '') }}
                      style={{ padding: '0.9rem 0.5rem', borderRadius: '14px', border: '2px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                        background: data.kmPerWeek === o.value ? '#02A257' : 'white',
                        borderColor: data.kmPerWeek === o.value ? '#02A257' : '#e8e8e8',
                      }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: data.kmPerWeek === o.value ? 'white' : '#282830', marginBottom: '0.2rem' }}>{o.label}</div>
                      <div style={{ fontSize: '0.65rem', color: data.kmPerWeek === o.value ? 'rgba(255,255,255,0.65)' : '#b0b3c1' }}>{o.desc}</div>
                    </button>
                  ))}
                </div>
                {data.kmPerWeek === '>60km' && (
                  <div className="flex items-center gap-3 mt-1">
                    <input type="number" placeholder="Volume exact" value={data.kmPerWeekCustom} onChange={e => set('kmPerWeekCustom', e.target.value)} autoFocus
                      className="flex-1 bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors" />
                    <span className="text-sm text-[#9ea0ae] flex-shrink-0 font-medium">km / sem</span>
                  </div>
                )}
              </div>

              {/* Expérience */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest">Depuis combien de temps cours-tu ?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '< 1 an',  label: '< 1 an',  desc: 'Je commence' },
                    { value: '1-5 ans', label: '1–5 ans', desc: 'Je progresse' },
                    { value: '> 5 ans', label: '> 5 ans', desc: 'Confirmé' },
                  ].map(o => (
                    <button key={o.value} onClick={() => { set('experience', o.value); set('experienceCustom', '') }}
                      style={{ padding: '0.9rem 0.5rem', borderRadius: '14px', border: '2px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                        background: data.experience === o.value ? '#02A257' : 'white',
                        borderColor: data.experience === o.value ? '#02A257' : '#e8e8e8',
                      }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: data.experience === o.value ? 'white' : '#282830', marginBottom: '0.2rem' }}>{o.label}</div>
                      <div style={{ fontSize: '0.65rem', color: data.experience === o.value ? 'rgba(255,255,255,0.65)' : '#b0b3c1' }}>{o.desc}</div>
                    </button>
                  ))}
                </div>
                {data.experience === '> 5 ans' && (
                  <input type="text" placeholder="Ex: 10 ans, 6 mois…" value={data.experienceCustom} onChange={e => set('experienceCustom', e.target.value)} autoFocus
                    className="mt-1 w-full bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors" />
                )}
              </div>

              {/* Sports d'endurance */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest">
                  Autre(s) sport(s) d'endurance <span className="normal-case font-normal text-[#c4c7d6]">(optionnel)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {ENDURANCE_SPORTS.map(s => (
                    <button key={s.value} onClick={() => toggleMulti('enduranceSports', s.value)}
                      style={{ padding: '0.45rem 1rem', borderRadius: '99px', border: '2px solid', cursor: 'pointer', transition: 'all 0.15s', fontSize: '0.82rem', fontWeight: '600',
                        background: data.enduranceSports.includes(s.value) ? '#02A257' : 'white',
                        borderColor: data.enduranceSports.includes(s.value) ? '#02A257' : '#e8e8e8',
                        color: data.enduranceSports.includes(s.value) ? 'white' : '#656779',
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                {data.enduranceSports.includes('Autre') && (
                  <input type="text" placeholder="Précise le sport…" value={data.enduranceSportsCustom} onChange={e => set('enduranceSportsCustom', e.target.value)} autoFocus
                    className="mt-1 w-full bg-white border border-[#c5e6d5] focus:border-[#02A257] rounded-xl px-4 py-3 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm transition-colors" />
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 — Références ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <StepHeader
                title="As-tu des chronos de référence ?"
                subtitle="Tes performances passées permettent de calibrer ton plan avec précision."
                icon={
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      {/* Chronomètre */}
                      <circle cx="18" cy="20" r="11" stroke="#02A257" strokeWidth="2.2"/>
                      <line x1="18" y1="20" x2="18" y2="12" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/>
                      <line x1="18" y1="20" x2="24" y2="20" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/>
                      <line x1="15" y1="7" x2="21" y2="7" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="18" y1="7" x2="18" y2="9" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                }
              />

              {/* Oui / Non */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: true,  label: 'Oui', desc: "J'ai des chronos" },
                  { value: false, label: 'Non', desc: 'Je démarre sans référence' },
                ].map(o => (
                  <button key={String(o.value)} onClick={() => { set('hasChronos', o.value); if (!o.value) setData(d => ({ ...d, refTimes: [] })) }}
                    style={{ padding: '1rem', borderRadius: '16px', border: '2px solid', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
                      background: data.hasChronos === o.value ? '#02A257' : 'white',
                      borderColor: data.hasChronos === o.value ? '#02A257' : '#e8e8e8',
                    }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: data.hasChronos === o.value ? 'white' : '#282830', marginBottom: '0.2rem' }}>{o.label}</div>
                    <div style={{ fontSize: '0.68rem', color: data.hasChronos === o.value ? 'rgba(255,255,255,0.65)' : '#b0b3c1' }}>{o.desc}</div>
                  </button>
                ))}
              </div>

              {/* Formulaire chronos */}
              {data.hasChronos === true && (
                <div className="flex flex-col gap-3">
                  {data.refTimes.map((rt, i) => {
                    const duration = [
                      rt.hours ? `${rt.hours}h` : '',
                      rt.minutes ? rt.minutes.padStart(2,'0') : '00',
                      ':',
                      rt.seconds ? rt.seconds.padStart(2,'0') : '00',
                    ].join('')
                    const pace = calcPace(duration, rt.distance, parseFloat(rt.customDistance))
                    return (
                      <div key={i} className="bg-white border border-[#e8e8e8] rounded-2xl overflow-hidden">
                        {/* Distance */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#f0f0f0]">
                          <select value={rt.distance} onChange={e => updateRefTime(i, 'distance', e.target.value)}
                            className="flex-1 bg-transparent text-sm font-semibold text-[#282830] focus:outline-none">
                            <option value="">Distance…</option>
                            {REF_DISTANCE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          {data.refTimes.length > 1 && (
                            <button onClick={() => removeRefTime(i)} className="text-[#c4c7d6] hover:text-red-400 transition-colors p-1">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {rt.distance === 'Autre' && (
                          <div className="flex items-center gap-4 px-4 py-3 border-b border-[#f0f0f0]">
                            <span className="text-xs text-[#9ea0ae] w-16 flex-shrink-0">Dist. (km)</span>
                            <input type="number" placeholder="ex: 15" value={rt.customDistance} onChange={e => updateRefTime(i, 'customDistance', e.target.value)}
                              className="flex-1 bg-transparent text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none" />
                          </div>
                        )}
                        {/* Chrono h/min/sec */}
                        <div className="px-4 py-3 border-b border-[#f0f0f0]">
                          <div className="text-xs text-[#9ea0ae] mb-2 font-medium">Chrono</div>
                          <div className="flex items-center gap-2">
                            {[
                              { key: 'hours',   placeholder: '0',  label: 'h',   max: 9 },
                              { key: 'minutes', placeholder: '00', label: 'min', max: 59 },
                              { key: 'seconds', placeholder: '00', label: 'sec', max: 59 },
                            ].map(({ key, placeholder, label, max }) => (
                              <div key={key} className="flex items-center gap-1 flex-1">
                                <input type="number" placeholder={placeholder} min="0" max={max} value={rt[key]}
                                  onChange={e => updateRefTime(i, key, e.target.value)}
                                  style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1.5px solid #e8e8e8', fontSize: '1rem', fontWeight: '700', color: '#282830', textAlign: 'center', background: '#f7f7f8' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#9ea0ae', flexShrink: 0 }}>{label}</span>
                              </div>
                            ))}
                            {pace && (
                              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#02A257', background: '#f0faf5', padding: '0.3rem 0.6rem', borderRadius: '8px', flexShrink: 0 }}>{pace}</span>
                            )}
                          </div>
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-4 px-4 py-3 bg-[#fafafa]">
                          <span className="text-xs text-[#9ea0ae] w-16 flex-shrink-0">Date</span>
                          <input type="date" value={rt.date} max={new Date().toISOString().split('T')[0]} onChange={e => updateRefTime(i, 'date', e.target.value)}
                            className="flex-1 bg-transparent text-xs text-[#464754] focus:outline-none" />
                        </div>
                      </div>
                    )
                  })}
                  <button onClick={addRefTime} className="flex items-center gap-2 text-sm font-semibold text-[#02A257] py-1 w-fit">
                    <Plus size={16} strokeWidth={2.5} />
                    Ajouter un chrono
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3 — Dispo ── */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quelle est ta disponibilité ?" subtitle="On adapte le volume à ton emploi du temps." icon={<div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="6" y="8" width="24" height="22" rx="4" stroke="#02A257" strokeWidth="2.2" fill="none"/><line x1="12" y1="5" x2="12" y2="11" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/><line x1="24" y1="5" x2="24" y2="11" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/><line x1="6" y1="15" x2="30" y2="15" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/><circle cx="13" cy="22" r="2" fill="#02A257"/><circle cx="23" cy="22" r="2" fill="#c5e6d5"/></svg></div>} />

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
                      onClick={() => {
                        set('sessionsPerWeek', n); set('sessionsCustom', ''); set('showSessionsCustom', false)
                        const suggestions = {
                          3: ['Mar', 'Jeu', 'Sam'],
                          4: ['Mar', 'Jeu', 'Sam', 'Dim'],
                          5: ['Lun', 'Mar', 'Jeu', 'Sam', 'Dim'],
                          6: ['Lun', 'Mar', 'Mer', 'Jeu', 'Sam', 'Dim'],
                        }
                        setData(d => ({ ...d, sessionsPerWeek: n, sessionsCustom: '', showSessionsCustom: false, preferredDays: d.preferredDays.length === 0 ? (suggestions[n] || []) : d.preferredDays }))
                      }}
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
                <div className="flex items-center justify-between pl-1">
                  <p className="text-xs font-semibold text-[#9ea0ae] uppercase tracking-widest">Jours préférés</p>
                  {data.preferredDays.length > 0 && (
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#02A257', background: '#f0faf5', border: '1px solid #c5e6d5', borderRadius: '99px', padding: '0.15rem 0.6rem' }}>
                      {data.preferredDays.length} jour{data.preferredDays.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleMulti('preferredDays', day)}
                      style={{
                        padding: '0.6rem 0', borderRadius: '12px', border: '2px solid', cursor: 'pointer',
                        transition: 'all 0.15s', textAlign: 'center', fontSize: '0.78rem', fontWeight: '700',
                        background: data.preferredDays.includes(day) ? '#02A257' : 'white',
                        borderColor: data.preferredDays.includes(day) ? '#02A257' : '#e8e8e8',
                        color: data.preferredDays.includes(day) ? 'white' : '#9ea0ae',
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>

              </div>

            </div>
          )}

          {/* ── STEP 4 — Objectif ── */}
          {step === 4 && (() => {
            const rH = riegelPrediction ? String(Math.floor(riegelPrediction / 60)) : ''
            const rM = riegelPrediction ? String(Math.floor(riegelPrediction % 60)) : ''
            const rS = riegelPrediction ? String(Math.round((riegelPrediction % 1) * 60)) : ''
            return (
            <div className="flex flex-col gap-5">
              <StepHeader
                title="Quel est ton objectif de course ?"
                icon={
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                      <circle cx="18" cy="18" r="12" stroke="#02A257" strokeWidth="2.2" fill="none"/>
                      <circle cx="18" cy="18" r="5" fill="#02A257"/>
                      <line x1="18" y1="4" x2="18" y2="7" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="18" y1="29" x2="18" y2="32" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="4" y1="18" x2="7" y2="18" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="29" y1="18" x2="32" y2="18" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                }
              />
              <div style={{ textAlign: 'center', marginTop: '-0.75rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>Ta course</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#02A257' }}>
                  {data.raceName || (data.distance === 'Autres' ? (data.customDistance + ' km') : data.distance)}
                </div>
                {data.raceDate && (
                  <div style={{ fontSize: '0.85rem', color: '#9ea0ae', marginTop: '0.2rem' }}>
                    {new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">

                {/* Finisher */}
                <button
                  onClick={() => setData(d => ({ ...d, goal: 'finish', targetTime: '', targetHours: '', targetMinutes: '', targetSeconds: '' }))}
                  style={{
                    padding: '1rem 1.25rem', borderRadius: '16px', border: '2px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    background: data.goal === 'finish' ? '#02A257' : 'white',
                    borderColor: data.goal === 'finish' ? '#02A257' : '#e8e8e8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: data.goal === 'finish' ? 'rgba(255,255,255,0.2)' : '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Flag size={18} color={data.goal === 'finish' ? 'white' : '#02A257'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: data.goal === 'finish' ? 'white' : '#282830' }}>Terminer la course</div>
                      <div style={{ fontSize: '0.72rem', color: data.goal === 'finish' ? 'rgba(255,255,255,0.7)' : '#9ea0ae', marginTop: '0.15rem' }}>Le plan se cale sur une allure confortable, objectif arrivée</div>
                    </div>
                  </div>
                </button>

                {/* Riegel suggestion */}
                {riegelPrediction && (
                  <button
                    onClick={() => {
                      setData(d => ({ ...d, goal: 'guided', targetHours: rH, targetMinutes: rM, targetSeconds: rS, targetTime: [rH ? `${rH}h` : '', rM.padStart(2,'0'), ':', rS.padStart(2,'0')].join('') }))
                    }}
                    style={{
                      padding: '1rem 1.25rem', borderRadius: '16px', border: '2px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                      background: data.goal === 'guided' ? '#02A257' : 'white',
                      borderColor: data.goal === 'guided' ? '#02A257' : '#e8e8e8',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: data.goal === 'guided' ? 'rgba(255,255,255,0.2)' : '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Zap size={18} color={data.goal === 'guided' ? 'white' : '#02A257'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '700', color: data.goal === 'guided' ? 'white' : '#282830' }}>Viser ~{formatMin(riegelPrediction)}</div>
                        <div style={{ fontSize: '0.72rem', color: data.goal === 'guided' ? 'rgba(255,255,255,0.7)' : '#9ea0ae', marginTop: '0.15rem' }}>Objectif calculé d'après tes chronos · basé sur ton {riegelSource?.distance}</div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Chrono custom */}
                <button
                  onClick={() => setData(d => ({ ...d, goal: 'time', targetHours: '', targetMinutes: '', targetSeconds: '', targetTime: '' }))}
                  style={{
                    padding: '1rem 1.25rem', borderRadius: '16px', border: '2px solid', textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s',
                    background: data.goal === 'time' ? '#02A257' : 'white',
                    borderColor: data.goal === 'time' ? '#02A257' : '#e8e8e8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: data.goal === 'time' ? 'rgba(255,255,255,0.2)' : '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Clock size={18} color={data.goal === 'time' ? 'white' : '#02A257'} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', color: data.goal === 'time' ? 'white' : '#282830' }}>J'ai un chrono en tête</div>
                      <div style={{ fontSize: '0.72rem', color: data.goal === 'time' ? 'rgba(255,255,255,0.7)' : '#9ea0ae', marginTop: '0.15rem' }}>Je saisis mon objectif moi-même</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Saisie h/min/sec */}
              {data.goal === 'time' && (
                <div className="bg-white border border-[#e8e8e8] rounded-2xl p-4">
                  <p style={{ fontSize: '0.68rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Ton chrono cible</p>
                  <div className="flex items-center gap-2">
                    {[
                      { key: 'targetHours',   placeholder: '0',  label: 'h',   max: 9 },
                      { key: 'targetMinutes', placeholder: '00', label: 'min', max: 59 },
                      { key: 'targetSeconds', placeholder: '00', label: 'sec', max: 59 },
                    ].map(({ key, placeholder, label, max }) => (
                      <div key={key} className="flex items-center gap-1 flex-1">
                        <input
                          type="number" placeholder={placeholder} min="0" max={max} value={data[key]}
                          onChange={e => {
                            const vals = { targetHours: data.targetHours, targetMinutes: data.targetMinutes, targetSeconds: data.targetSeconds, [key]: e.target.value }
                            setTargetTime(vals.targetHours, vals.targetMinutes, vals.targetSeconds)
                          }}
                          style={{ width: '100%', padding: '0.6rem', borderRadius: '10px', border: '1.5px solid #e8e8e8', fontSize: '1.1rem', fontWeight: '700', color: '#282830', textAlign: 'center', background: '#f7f7f8' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#9ea0ae', flexShrink: 0 }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[#9ea0ae] mt-3">Ce chrono guidera l'intensité de chaque séance.</p>
                </div>
              )}

              {/* Pour le mode guidé, afficher le temps calculé */}
              {data.goal === 'guided' && riegelPrediction && (
                <div className="flex items-center gap-3 bg-[#02A257]/5 border border-[#02A257]/20 rounded-xl px-4 py-3">
                  <TrendingUp size={14} className="text-[#02A257] flex-shrink-0" strokeWidth={2} />
                  <p className="text-xs text-[#656779] leading-relaxed flex-1">
                    Plan calé sur <span className="font-semibold text-[#02A257]">{formatMin(riegelPrediction)}</span> d'après ton {riegelSource?.distance}{riegelSource?.date ? ` de ${new Date(riegelSource.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}` : ''}. Tu pourras ajuster après.
                  </p>
                </div>
              )}
            </div>
            )
          })()}

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
              <StepHeader
                title="Tout est prêt !"
                titleColor="#02A257"
                center
                icon={
                  <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'white', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                    <svg width="42" height="42" viewBox="0 0 52 52" fill="none">
                      <rect x="4" y="14" width="44" height="24" rx="12" stroke="#02A257" strokeWidth="5" fill="none"/>
                    </svg>
                  </div>
                }
              />

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
                <div className="flex pt-3 border-t border-[#daf0e8]">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-[#9ea0ae] font-medium">Volume total estimé</p>
                    <p className="text-base font-bold text-[#282830] mt-0.5">~{totalKm} km</p>
                  </div>
                  <div className="w-px bg-[#daf0e8]" />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-[#9ea0ae] font-medium">Moy. par semaine</p>
                    <p className="text-base font-bold text-[#282830] mt-0.5">~{avgKmWeek} km</p>
                  </div>
                </div>
              </div>

              <ConfidenceIndicator confidence={confidence} />

              {/* Summary rows — collapsible */}
              <div className="bg-white border border-[#c5e6d5] rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setSummaryOpen(o => !o)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#02A257', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modifier mes infos</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transition: 'transform 0.2s', transform: summaryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M4 6l4 4 4-4" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {summaryOpen && (
                  <div className="divide-y divide-[#daf0e8] border-t border-[#daf0e8]">
                    <SummaryRow label="Course" value={`${data.distance === 'Autres' ? (data.customDistance + ' km') : data.distance}${data.raceName ? ` — ${data.raceName}` : ''}`} onEdit={() => editFromResume(0)} />
                    <SummaryRow label="Date" value={data.raceDate ? new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} onEdit={() => editFromResume(0)} />
                    <SummaryRow label="Volume" value={data.kmPerWeekCustom ? `${data.kmPerWeekCustom} km/sem` : data.kmPerWeek} onEdit={() => editFromResume(1)} />
                    <SummaryRow label="Expérience" value={data.experienceCustom || data.experience || '—'} onEdit={() => editFromResume(1)} />
                    {hasRefTimes && (
                      <SummaryRow
                        label="Références"
                        value={data.refTimes.filter(r => getRefTimeDuration(r)).map(r => {
                          const dur = getRefTimeDuration(r)
                          const pace = calcPace(dur, r.distance, parseFloat(r.customDistance))
                          return `${r.distance === 'Autre' ? r.customDistance + 'km' : r.distance} ${dur}${pace ? ` (${pace})` : ''}`
                        }).join(' · ')}
                        onEdit={() => editFromResume(2)}
                      />
                    )}
                    <SummaryRow label="Séances" value={`${data.sessionsPerWeek ?? data.sessionsCustom}/sem · ${data.preferredDays.join(', ')}`} onEdit={() => editFromResume(3)} />
                    <SummaryRow label="Objectif" value={data.targetTime ? `Chrono : ${data.targetTime}` : 'Finisher'} onEdit={() => editFromResume(4)} />
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button onClick={() => setVitePlusOpen(true)} style={{ padding: '0.5rem 1.1rem', borderRadius: '99px', border: '1.5px solid #7c3aed', background: '#faf5ff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 52 52" fill="none"><rect x="4" y="14" width="44" height="24" rx="12" stroke="white" strokeWidth="8" fill="none"/></svg>
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7c3aed' }}>Mode +VITE</span>
                </button>
              </div>

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
                onClick={() => setStartModalOpen(true)}
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

      {/* ── Modale +VITE ── */}
      {vitePlusOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setVitePlusOpen(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(124,58,237,0.2)' }}
            onClick={e => e.stopPropagation()}>

            {/* Header violet */}
            <div style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', borderRadius: '22px 22px 0 0', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 52 52" fill="none"><rect x="4" y="14" width="44" height="24" rx="12" stroke="white" strokeWidth="6" fill="none"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: '800', color: 'white' }}>Mode +VITE</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', marginTop: '0.1rem' }}>Données expert pour un plan ultra-précis</p>
                </div>
              </div>
              <button onClick={() => setVitePlusOpen(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="white" />
              </button>
            </div>

            {/* Champs */}
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Cardio */}
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Cardiaque</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { key: 'fcMax', label: 'FC Max', placeholder: '185', unit: 'bpm' },
                  { key: 'fcRepos', label: 'FC Repos', placeholder: '48', unit: 'bpm' },
                  { key: 'vfc', label: 'VFC', placeholder: '65', unit: 'ms' },
                  { key: 'vo2max', label: 'VO2max', placeholder: '55', unit: 'ml/kg/min' },
                  { key: 'spo2', label: 'SpO2', placeholder: '98', unit: '%' },
                ].map(({ key, label, placeholder, unit }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '0.45rem 0.7rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#a78bfa', flexShrink: 0 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input type="number" placeholder={placeholder} value={vitePlusData[key]}
                        onChange={e => setVitePlusData(d => ({ ...d, [key]: e.target.value }))}
                        style={{ width: '52px', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '700', color: '#282830', outline: 'none', textAlign: 'right' }} />
                      <span style={{ fontSize: '0.6rem', color: '#c4b5fd', fontWeight: '600' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cyclisme */}
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>Cyclisme</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '0.45rem 0.7rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#a78bfa' }}>FTP Vélo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input type="number" placeholder="220" value={vitePlusData.ftpVelo}
                    onChange={e => setVitePlusData(d => ({ ...d, ftpVelo: e.target.value }))}
                    style={{ width: '52px', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '700', color: '#282830', outline: 'none', textAlign: 'right' }} />
                  <span style={{ fontSize: '0.6rem', color: '#c4b5fd', fontWeight: '600' }}>W</span>
                </div>
              </div>

              {/* Morphologie */}
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>Morphologie</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { key: 'poids', label: 'Poids', placeholder: '70', unit: 'kg' },
                  { key: 'taille', label: 'Taille', placeholder: '175', unit: 'cm' },
                ].map(({ key, label, placeholder, unit }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '0.45rem 0.7rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#a78bfa' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input type="number" placeholder={placeholder} value={vitePlusData[key]}
                        onChange={e => setVitePlusData(d => ({ ...d, [key]: e.target.value }))}
                        style={{ width: '52px', border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: '700', color: '#282830', outline: 'none', textAlign: 'right' }} />
                      <span style={{ fontSize: '0.6rem', color: '#c4b5fd', fontWeight: '600' }}>{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['Homme', 'Femme', 'Autre'].map(s => (
                  <button key={s} onClick={() => setVitePlusData(d => ({ ...d, sexe: s }))}
                    style={{ flex: 1, padding: '0.45rem', borderRadius: '10px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', transition: 'all 0.15s',
                      background: vitePlusData.sexe === s ? '#7c3aed' : '#faf5ff',
                      borderColor: vitePlusData.sexe === s ? '#7c3aed' : '#e9d5ff',
                      color: vitePlusData.sexe === s ? 'white' : '#a78bfa',
                    }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Chaussures */}
              <p style={{ fontSize: '0.68rem', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>Chaussures</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { key: 'chaussureMarque', label: 'Marque', placeholder: 'ex: Nike' },
                  { key: 'chaussuresModele', label: 'Modèle', placeholder: 'ex: Vaporfly 3' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <p style={{ fontSize: '0.68rem', fontWeight: '600', color: '#9ea0ae', marginBottom: '0.35rem' }}>{label}</p>
                    <input type="text" placeholder={placeholder} value={vitePlusData[key]}
                      onChange={e => setVitePlusData(d => ({ ...d, [key]: e.target.value }))}
                      style={{ width: '100%', background: '#faf5ff', border: '1.5px solid #e9d5ff', borderRadius: '10px', padding: '0.5rem 0.75rem', fontSize: '0.88rem', fontWeight: '600', color: '#282830', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>

              {/* Bouton save */}
              <button onClick={() => setVitePlusOpen(false)}
                style={{ marginTop: '0.5rem', width: '100%', padding: '0.9rem', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'white', fontWeight: '700', fontSize: '0.88rem', border: 'none', cursor: 'pointer' }}>
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale démarrage ── */}
      {startModalOpen && (() => {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]
        const nextMonday = new Date(today)
        nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7))
        const nextMondayStr = nextMonday.toISOString().split('T')[0]
        const weekAfter = new Date(nextMonday)
        weekAfter.setDate(nextMonday.getDate() + 7)
        const weekAfterStr = weekAfter.toISOString().split('T')[0]

        const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

        const recommendedDate = data.raceDate
          ? (() => {
              const d = new Date(data.raceDate)
              d.setDate(d.getDate() - planWeeks * 7)
              return d < today ? todayStr : d.toISOString().split('T')[0]
            })()
          : nextMondayStr

        const selected = planStartDate || recommendedDate

        const options = [
          { value: recommendedDate, label: 'Date recommandée', desc: fmt(recommendedDate), recommended: true, hint: `Ton programme de ${planWeeks} semaines se termine pile pour ta course du ${new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` },
          { value: todayStr, label: "Aujourd'hui", desc: fmt(todayStr) },
          { value: nextMondayStr, label: 'Lundi prochain', desc: fmt(nextMondayStr) },
        ].filter((o, i, arr) => arr.findIndex(x => x.value === o.value) === i)

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setStartModalOpen(false)}>
            <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f0faf5', border: '1.5px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                    <rect x="6" y="8" width="24" height="22" rx="4" stroke="#02A257" strokeWidth="2.2" fill="none"/>
                    <line x1="12" y1="5" x2="12" y2="11" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="24" y1="5" x2="24" y2="11" stroke="#02A257" strokeWidth="2.2" strokeLinecap="round"/>
                    <line x1="6" y1="15" x2="30" y2="15" stroke="#02A257" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="13" cy="22" r="2" fill="#02A257"/>
                    <circle cx="23" cy="22" r="2" fill="#c5e6d5"/>
                  </svg>
                </div>
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#282830', marginBottom: '1.25rem', textAlign: 'center' }}>Quand commences-tu ?</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                {options.map(o => {
                  const isSelected = selected === o.value
                  return (
                    <button key={o.value} onClick={() => setPlanStartDate(o.value)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.1rem', borderRadius: '14px', border: '2px solid', cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left',
                        background: isSelected ? '#f0faf5' : 'white',
                        borderColor: isSelected ? '#02A257' : '#e8e8e8',
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                              {o.recommended && (
                                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#02A257', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <svg width="11" height="11" viewBox="0 0 52 52" fill="none">
                                    <rect x="4" y="14" width="44" height="24" rx="12" stroke="white" strokeWidth="6" fill="none"/>
                                  </svg>
                                </div>
                              )}
                              <span style={{ fontSize: '0.68rem', fontWeight: '600', color: isSelected ? '#02A257' : '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{o.label}</span>
                            </div>
                          <span style={{ fontSize: '0.88rem', fontWeight: '700', color: isSelected ? '#02A257' : '#282830', textTransform: 'capitalize' }}>{o.desc}</span>
                          </div>
                          {isSelected && (
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#02A257', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '0.5rem' }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                          )}
                        </div>
                        {o.hint && (
                          <div style={{ fontSize: '0.72rem', color: '#9ea0ae', marginTop: '0.3rem' }}>{o.hint}</div>
                        )}
                      </div>
                    </button>

                  )
                })}

                {/* Date custom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '14px', border: '1.5px solid #e8e8e8', background: '#fafafa' }}>
                  <span style={{ fontSize: '0.8rem', color: '#9ea0ae', flexShrink: 0 }}>Autre date</span>
                  <input type="date" min={todayStr}
                    value={!options.find(o => o.value === selected) ? selected : ''}
                    onChange={e => setPlanStartDate(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '0.82rem', color: '#282830', outline: 'none' }} />
                </div>
              </div>

              <button onClick={() => { setStartModalOpen(false); handleGenerate() }}
                style={{ width: '100%', padding: '1rem', borderRadius: '16px', background: '#02A257', color: 'white', fontWeight: '700', fontSize: '0.9rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Générer mon plan <Sparkles size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Sub-components ────────────────────────────

function StepHeader({ title, subtitle, icon, center, titleColor }) {
  const centered = icon || center
  return (
    <div className={`mb-1 ${centered ? 'text-center' : ''}`}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight mb-1.5 leading-snug" style={{ color: titleColor || '#282830' }}>{title}</h1>
      {subtitle && <p className="text-[#656779] text-sm leading-relaxed">{subtitle}</p>}
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
      <div className="flex flex-col items-center px-5 py-4 gap-2">
        <p className="text-xs text-[#9ea0ae] uppercase tracking-wide font-semibold">Indice de confiance</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#282830]">{label}</span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>{score} / 100</span>
        </div>
      </div>
      <div className="flex items-center gap-3 mx-5 mb-4">
        <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${style.bar}`} style={{ width: `${score}%` }} />
        </div>
        <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${style.iconBg}`}>
          <TierIcon size={13} color="white" strokeWidth={2.5} />
        </div>
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

export default function Onboarding() {
  return (
    <Suspense>
      <OnboardingInner />
    </Suspense>
  )
}

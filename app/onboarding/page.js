'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Check, TrendingUp, AlertCircle, X, ChevronRight, Sparkles } from 'lucide-react'

const STEPS = ['Course', 'Niveau', 'Références', 'Objectif', 'Dispo', 'Tracker', 'Résumé']

const DISTANCES = [
  { value: '5K', label: '5K', desc: '5 km' },
  { value: '10K', label: '10K', desc: '10 km' },
  { value: 'Semi', label: 'Semi', desc: '21,1 km' },
  { value: 'Marathon', label: 'Marathon', desc: '42,2 km' },
  { value: 'Trail', label: 'Trail', desc: 'Hors stade' },
]

const KM_WEEK = [
  { value: '< 20km', label: '< 20 km', desc: 'Je commence ou reprends' },
  { value: '20-40km', label: '20 – 40 km', desc: 'Coureur régulier' },
  { value: '40-60km', label: '40 – 60 km', desc: 'Entraînement sérieux' },
  { value: '> 60km', label: '> 60 km', desc: 'Niveau avancé' },
]

const LONGEST_RUN = [
  { value: '< 10km', label: '< 10 km' },
  { value: '10-15km', label: '10 – 15 km' },
  { value: '15-21km', label: '15 – 21 km' },
  { value: '> 21km', label: '> 21 km' },
]

const EXPERIENCE = [
  { value: '< 1 an', label: "Moins d'1 an" },
  { value: '1-3 ans', label: '1 à 3 ans' },
  { value: '> 3 ans', label: 'Plus de 3 ans' },
]

const REF_DISTANCES = {
  '5K':      [{ key: '5K', label: '5K', placeholder: 'ex: 25:30' }],
  '10K':     [{ key: '5K', label: '5K', placeholder: 'ex: 25:30' }, { key: '10K', label: '10K', placeholder: 'ex: 52:00' }],
  'Semi':    [{ key: '10K', label: '10K', placeholder: 'ex: 52:00' }, { key: 'Semi', label: 'Semi-marathon', placeholder: 'ex: 1h55:00' }],
  'Marathon':[{ key: '10K', label: '10K', placeholder: 'ex: 52:00' }, { key: 'Semi', label: 'Semi-marathon', placeholder: 'ex: 1h55:00' }, { key: 'Marathon', label: 'Marathon', placeholder: 'ex: 4h10:00' }],
  'Trail':   [{ key: '10K', label: '10K', placeholder: 'ex: 52:00' }, { key: 'Semi', label: 'Semi-marathon', placeholder: 'ex: 1h55:00' }, { key: 'Trail', label: 'Trail', placeholder: 'ex: 2h30:00' }],
}

const MIN_WEEKS = { '5K': 3, '10K': 4, 'Semi': 6, 'Marathon': 8, 'Trail': 8 }

const GOALS = [
  { value: 'finish', label: 'Terminer la course', desc: "L'objectif est de franchir la ligne d'arrivée" },
  { value: 'time', label: 'Objectif de temps', desc: 'Je vise un chrono précis' },
  { value: 'perform', label: 'Performer', desc: 'Je veux me dépasser et battre mon record' },
]

const SESSIONS = [
  { value: 3, label: '3 séances', desc: 'Idéal pour débuter' },
  { value: 4, label: '4 séances', desc: 'Progression régulière' },
  { value: 5, label: '5 séances', desc: 'Préparation intensive' },
]

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const DIST_KM = { '5K': 5, '10K': 10, 'Semi': 21.1, 'Marathon': 42.195, 'Trail': 42 }

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

function computeConfidence(data) {
  let score = 70
  const signals = []

  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const minWeeks = MIN_WEEKS[data.distance] || 0

  if (weeksUntilRace !== null) {
    const ratio = weeksUntilRace / minWeeks
    if (ratio >= 2) { score += 15; signals.push({ type: 'positive', text: `${weeksUntilRace} semaines de préparation — délai idéal` }) }
    else if (ratio >= 1.3) { score += 5; signals.push({ type: 'positive', text: `${weeksUntilRace} semaines, bonne marge de progression` }) }
    else if (ratio >= 1) { signals.push({ type: 'warning', text: `${weeksUntilRace} semaines, délai juste mais faisable` }) }
    else { score -= 25; signals.push({ type: 'negative', text: `Seulement ${weeksUntilRace} sem. — minimum recommandé : ${minWeeks} sem.` }) }
  }

  const volMatrix = {
    '5K':      { '< 20km': 5,   '20-40km': 10,  '40-60km': 10,  '> 60km': 10 },
    '10K':     { '< 20km': -5,  '20-40km': 5,   '40-60km': 10,  '> 60km': 10 },
    'Semi':    { '< 20km': -20, '20-40km': 0,   '40-60km': 10,  '> 60km': 10 },
    'Marathon':{ '< 20km': -30, '20-40km': -10, '40-60km': 5,   '> 60km': 15 },
    'Trail':   { '< 20km': -25, '20-40km': -5,  '40-60km': 5,   '> 60km': 15 },
  }
  const vs = volMatrix[data.distance]?.[data.kmPerWeek]
  if (vs !== undefined) {
    score += vs
    if (vs <= -20) signals.push({ type: 'negative', text: `Volume actuel (${data.kmPerWeek}/sem) insuffisant pour un ${data.distance}` })
    else if (vs < 0) signals.push({ type: 'warning', text: `Volume actuel (${data.kmPerWeek}/sem) un peu faible pour un ${data.distance}` })
    else if (vs >= 10) signals.push({ type: 'positive', text: `Volume actuel (${data.kmPerWeek}/sem) bien adapté` })
  }

  if (data.targetTime && data.goal !== 'finish') {
    const targetMin = parseTimeToMin(data.targetTime)
    const targetDistKm = DIST_KM[data.distance]
    if (targetMin && targetDistKm) {
      let bestPrediction = null
      for (const [key, val] of Object.entries(data.refTimes)) {
        if (!val?.time) continue
        const refMin = parseTimeToMin(val.time)
        const refDistKm = DIST_KM[key]
        if (!refMin || !refDistKm || refDistKm === targetDistKm) continue
        const predicted = riegel(refMin, refDistKm, targetDistKm)
        if (!bestPrediction || predicted < bestPrediction) bestPrediction = predicted
      }
      const sameRef = data.refTimes[data.distance]?.time
      if (sameRef) { const sameMin = parseTimeToMin(sameRef); if (sameMin) bestPrediction = sameMin }
      if (bestPrediction) {
        const ratio = targetMin / bestPrediction
        const predStr = formatMin(bestPrediction)
        if (ratio < 0.88) { score -= 30; signals.push({ type: 'negative', text: `Objectif très ambitieux : ton niveau prédit ~${predStr} sur ${data.distance}` }) }
        else if (ratio < 0.95) { score -= 12; signals.push({ type: 'warning', text: `Objectif ambitieux : ton niveau suggère ~${predStr} sur ${data.distance}` }) }
        else if (ratio <= 1.05) { score += 8; signals.push({ type: 'positive', text: `Objectif cohérent avec tes chronos (niveau prédit ~${predStr})` }) }
        else { score += 12; signals.push({ type: 'positive', text: `Objectif prudent — tu as de la marge (niveau prédit ~${predStr})` }) }
      }
    }
  }

  if (data.goal === 'finish') { score += 10; signals.push({ type: 'positive', text: "Objectif finisher — le plus accessible" }) }
  else if (data.goal === 'perform') { score -= 5 }

  score = Math.max(5, Math.min(100, score))
  if (score >= 75) return { score, label: 'Réaliste', tier: 'green', signals }
  if (score >= 55) return { score, label: 'Ambitieux', tier: 'indigo', signals }
  if (score >= 35) return { score, label: 'Très ambitieux', tier: 'amber', signals }
  return { score, label: 'Risqué', tier: 'red', signals }
}

/* ─────────────────────────────────────────── */

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    distance: '', raceName: '', raceDate: '',
    kmPerWeek: '', longestRun: '', experience: '',
    refTimes: {}, goal: '', targetTime: '',
    sessionsPerWeek: 4, preferredDays: [],
  })

  const set = (key, value) => setData(d => ({ ...d, [key]: value }))
  const setRefTime = (key, field, value) =>
    setData(d => ({ ...d, refTimes: { ...d.refTimes, [key]: { ...d.refTimes[key], [field]: value } } }))
  const toggleDay = (day) =>
    setData(d => ({
      ...d,
      preferredDays: d.preferredDays.includes(day)
        ? d.preferredDays.filter(x => x !== day)
        : [...d.preferredDays, day],
    }))

  const canNext = () => {
    if (step === 0) return data.distance && data.raceDate
    if (step === 1) return data.kmPerWeek && data.longestRun && data.experience
    if (step === 2) return true
    if (step === 3) return data.goal && (data.goal === 'finish' || data.targetTime)
    if (step === 4) return data.sessionsPerWeek && data.preferredDays.length >= 2
    if (step === 5) return true
    return true
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/onboarding/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) router.push('/dashboard')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const confidence = computeConfidence(data)
  const refFields = REF_DISTANCES[data.distance] || []
  const hasRefTimes = Object.values(data.refTimes).some(v => v?.time?.trim())
  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const minWeeks = MIN_WEEKS[data.distance] || 0
  const dateTooSoon = weeksUntilRace !== null && weeksUntilRace < minWeeks

  return (
    <div className="min-h-screen bg-[#f5f8ee] flex flex-col font-sans">

      {/* Header */}
      <div className="bg-white border-b border-[#dde5cb] sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4 max-w-2xl mx-auto w-full">
          <Link href="/" className="text-sm font-semibold text-[#282830] tracking-tight">PaceIQ</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#9ea0ae]">
              {step + 1} / {STEPS.length}
            </span>
          </div>
        </div>
        <div className="h-1 bg-[#ecf3df] max-w-full">
          <div
            className="h-full bg-[#6b9a23] transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step pills */}
      <div className="max-w-2xl mx-auto w-full px-6 pt-5 pb-2 flex gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <span key={s} className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium transition-all ${
            i === step ? 'bg-[#6b9a23] text-white shadow-sm'
            : i < step ? 'bg-[#6b9a23]/10 text-[#6b9a23]'
            : 'bg-white border border-[#dde5cb] text-[#9ea0ae]'
          }`}>
            {i < step && <Check size={10} strokeWidth={3} />}
            {s}
          </span>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-6 pb-16">
        <div className="w-full max-w-lg">

          {/* Step 0 — Course cible */}
          {step === 0 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quelle course prépares-tu ?" subtitle="Choisis la distance et la date de ta prochaine course." />
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {DISTANCES.map(d => (
                  <OptionCard key={d.value} active={data.distance === d.value} onClick={() => set('distance', d.value)} label={d.label} desc={d.desc} />
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Nom de la course (optionnel)"
                  value={data.raceName}
                  onChange={e => set('raceName', e.target.value)}
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-[#656779] font-medium pl-1">Date de la course</label>
                  <input
                    type="date"
                    value={data.raceDate}
                    onChange={e => set('raceDate', e.target.value)}
                    className={`w-full bg-white border rounded-2xl px-4 py-3.5 text-sm text-[#282830] focus:outline-none transition-colors shadow-sm ${
                      dateTooSoon ? 'border-amber-300 focus:border-amber-400' : 'border-[#dde5cb] focus:border-[#6b9a23]'
                    }`}
                  />
                </div>
                {dateTooSoon && (
                  <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="text-amber-700 text-sm font-semibold">Délai court pour un {data.distance}</p>
                      <p className="text-amber-600 text-xs mt-1 leading-relaxed">
                        Il reste {weeksUntilRace} semaine{weeksUntilRace > 1 ? 's' : ''} — minimum recommandé : {minWeeks} sem.
                        Tu peux continuer, le plan sera adapté.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1 — Niveau actuel */}
          {step === 1 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quel est ton niveau actuel ?" subtitle="Ces informations serviront à calibrer ton plan." />
              <div>
                <Label>Km par semaine en ce moment</Label>
                <div className="grid grid-cols-2 gap-3">
                  {KM_WEEK.map(o => <OptionCard key={o.value} active={data.kmPerWeek === o.value} onClick={() => set('kmPerWeek', o.value)} label={o.label} desc={o.desc} />)}
                </div>
              </div>
              <div>
                <Label>Ta plus longue sortie récente</Label>
                <div className="grid grid-cols-2 gap-3">
                  {LONGEST_RUN.map(o => <OptionCard key={o.value} active={data.longestRun === o.value} onClick={() => set('longestRun', o.value)} label={o.label} />)}
                </div>
              </div>
              <div>
                <Label>Depuis combien de temps tu cours ?</Label>
                <div className="grid grid-cols-3 gap-3">
                  {EXPERIENCE.map(o => <OptionCard key={o.value} active={data.experience === o.value} onClick={() => set('experience', o.value)} label={o.label} />)}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Temps de référence */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="As-tu des temps de référence ?" subtitle="Tes chronos passés permettent de calibrer ton plan avec précision." />
              <span className="inline-flex items-center gap-1.5 bg-[#6b9a23]/8 text-[#6b9a23] text-xs px-3 py-1.5 rounded-full font-medium w-fit border border-[#6b9a23]/20">
                <ChevronRight size={11} strokeWidth={2.5} />
                Optionnel — tu peux passer cette étape
              </span>
              <div className="flex flex-col gap-3">
                {refFields.map(({ key, label, placeholder }) => (
                  <div key={key} className="bg-white border border-[#dde5cb] rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-[#edf3de]">
                      <span className="text-sm font-semibold text-[#282830] w-28 flex-shrink-0">{label}</span>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={data.refTimes[key]?.time || ''}
                        onChange={e => setRefTime(key, 'time', e.target.value)}
                        className="flex-1 bg-transparent text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-4 px-4 py-3 bg-[#f7faf0]">
                      <span className="text-xs text-[#9ea0ae] w-28 flex-shrink-0">Date de la course</span>
                      <input
                        type="date"
                        value={data.refTimes[key]?.date || ''}
                        onChange={e => setRefTime(key, 'date', e.target.value)}
                        className="flex-1 bg-transparent text-xs text-[#464754] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#c4c7d6] text-center">Format libre : 45:30 · 1h52:00 · 3h45</p>
            </div>
          )}

          {/* Step 3 — Objectif */}
          {step === 3 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quel est ton objectif ?" subtitle="Sois honnête, le plan s'adaptera en conséquence." />
              <div className="flex flex-col gap-3">
                {GOALS.map(o => <OptionCard key={o.value} active={data.goal === o.value} onClick={() => set('goal', o.value)} label={o.label} desc={o.desc} horizontal />)}
              </div>
              {(data.goal === 'time' || data.goal === 'perform') && (
                <div className="flex flex-col gap-2">
                  <Label>{data.goal === 'time' ? 'Ton objectif de temps' : 'Ton record à battre'}</Label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={data.distance === 'Marathon' ? 'ex: 3h45:00' : data.distance === 'Semi' ? 'ex: 1h50:00' : 'ex: 52:00'}
                      value={data.targetTime}
                      onChange={e => set('targetTime', e.target.value)}
                      className="w-full bg-white border-2 border-[#6b9a23] rounded-2xl px-4 py-4 text-lg font-bold text-[#282830] placeholder-[#c4c7d6] focus:outline-none shadow-sm tracking-wide"
                      autoFocus
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#9ea0ae] font-semibold bg-[#f5f8ee] px-2 py-0.5 rounded-lg">{data.distance}</span>
                  </div>
                  <p className="text-xs text-[#9ea0ae] pl-1">Ce chrono guidera l'intensité de chaque séance.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Disponibilité */}
          {step === 4 && (
            <div className="flex flex-col gap-6">
              <StepHeader title="Quelle est ta disponibilité ?" subtitle="On adapte le volume à ton emploi du temps." />
              <div>
                <Label>Séances par semaine</Label>
                <div className="grid grid-cols-3 gap-3">
                  {SESSIONS.map(o => <OptionCard key={o.value} active={data.sessionsPerWeek === o.value} onClick={() => set('sessionsPerWeek', o.value)} label={o.label} desc={o.desc} />)}
                </div>
              </div>
              <div>
                <Label>Jours préférés (minimum 2)</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                        data.preferredDays.includes(day)
                          ? 'bg-[#6b9a23] text-white shadow-[#6b9a23]/25'
                          : 'bg-white border border-[#dde5cb] text-[#464754] hover:border-[#6b9a23]/50 hover:text-[#6b9a23]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5 — Tracker */}
          {step === 5 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Suis tes séances automatiquement" subtitle="Connecte un tracker d'activité pour valider tes séances automatiquement." />
              <div className="flex flex-col gap-3 opacity-50 pointer-events-none select-none">
                <div className="w-full flex items-center gap-4 p-5 bg-white border border-[#dde5cb] rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-[#FC4C02] flex items-center justify-center flex-shrink-0">
                    <StravaIcon />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-[#282830]">Strava</div>
                    <div className="text-xs text-[#656779] mt-0.5">Sync automatique de tes activités</div>
                  </div>
                  <span className="text-xs font-semibold bg-[#f5f8ee] text-[#9ea0ae] border border-[#dde5cb] px-2.5 py-1 rounded-full">Bientôt</span>
                </div>
                <div className="w-full flex items-center gap-4 p-5 bg-white border border-[#dde5cb] rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ea0ae" strokeWidth="1.75"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-semibold text-[#282830]">Garmin · Apple Watch</div>
                    <div className="text-xs text-[#656779] mt-0.5">Connecte ta montre directement</div>
                  </div>
                  <span className="text-xs font-semibold bg-[#f5f8ee] text-[#9ea0ae] border border-[#dde5cb] px-2.5 py-1 rounded-full">Bientôt</span>
                </div>
              </div>
              <p className="text-xs text-[#9ea0ae] text-center leading-relaxed">
                La connexion aux trackers sera disponible prochainement.<br />Tu pourras l'activer depuis ton dashboard.
              </p>
            </div>
          )}

          {/* Step 6 — Résumé */}
          {step === 6 && (
            <div className="flex flex-col gap-5">
              <StepHeader title="Tout est prêt" subtitle="Vérifie tes paramètres avant de générer ton plan personnalisé." />
              <div className="bg-white border border-[#dde5cb] rounded-2xl overflow-hidden shadow-sm divide-y divide-[#edf3de]">
                <SummaryRow label="Course" value={`${data.distance}${data.raceName ? ` — ${data.raceName}` : ''}`} />
                <SummaryRow label="Date" value={data.raceDate ? new Date(data.raceDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                <SummaryRow label="Volume" value={`${data.kmPerWeek} / sem · sortie max ${data.longestRun}`} />
                <SummaryRow label="Expérience" value={data.experience} />
                {hasRefTimes && (
                  <SummaryRow
                    label="Références"
                    value={Object.entries(data.refTimes).filter(([, v]) => v?.time).map(([k, v]) => `${k} ${v.time}${v.date ? ` (${new Date(v.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })})` : ''}`).join(' · ')}
                  />
                )}
                <SummaryRow label="Objectif" value={data.goal === 'finish' ? 'Terminer la course' : data.goal === 'time' ? `Chrono : ${data.targetTime}` : `Performer — ${data.targetTime}`} />
                <SummaryRow label="Séances" value={`${data.sessionsPerWeek} / sem · ${data.preferredDays.join(', ')}`} />
              </div>

              <ConfidenceIndicator confidence={confidence} />

              <p className="text-xs text-[#c4c7d6] text-center leading-relaxed">
                Le plan sera généré par IA et s'adaptera au fil de tes sorties.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3.5 rounded-2xl border border-[#dde5cb] bg-white text-sm text-[#656779] hover:text-[#282830] hover:border-[#6b9a23]/30 transition-all font-medium shadow-sm"
              >
                Retour
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 py-3.5 rounded-2xl bg-[#6b9a23] hover:bg-[#5a8219] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {step === 2 && !hasRefTimes ? 'Passer cette étape'
                  : step === 0 && dateTooSoon ? 'Continuer quand même'
                  : 'Continuer'}
              </button>
            ) : step === STEPS.length - 1 ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-3.5 rounded-2xl bg-[#6b9a23] hover:bg-[#5a8219] text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-60"
              >
                {loading ? 'Génération en cours…' : (
                  <span className="inline-flex items-center gap-2">
                    Générer mon plan <Sparkles size={14} strokeWidth={2} />
                  </span>
                )}
              </button>
            ) : null}
          </div>

        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ─────────────────────────── */

function StepHeader({ title, subtitle }) {
  return (
    <div className="mb-1">
      <h1 className="text-2xl font-bold text-[#282830] tracking-tight mb-2 leading-snug">{title}</h1>
      <p className="text-[#656779] text-sm leading-relaxed">{subtitle}</p>
    </div>
  )
}

function Label({ children }) {
  return <p className="text-xs text-[#9ea0ae] mb-2.5 font-semibold uppercase tracking-wider">{children}</p>
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-[#dde5cb] rounded-2xl px-4 py-3.5 text-sm text-[#282830] placeholder-[#c4c7d6] focus:outline-none focus:border-[#6b9a23] transition-colors shadow-sm ${className}`}
    />
  )
}

function OptionCard({ active, onClick, label, desc, horizontal }) {
  if (horizontal) {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all shadow-sm ${
          active
            ? 'border-[#6b9a23] bg-[#6b9a23]/5 shadow-[#6b9a23]/10'
            : 'border-[#dde5cb] bg-white hover:border-[#6b9a23]/40'
        }`}
      >
        <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${active ? 'border-[#6b9a23] bg-[#6b9a23]' : 'border-[#c4c7d6]'}`}>
          {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <div className={`text-sm font-semibold transition-colors ${active ? 'text-[#6b9a23]' : 'text-[#282830]'}`}>{label}</div>
          {desc && <div className="text-xs text-[#656779] mt-0.5 leading-relaxed">{desc}</div>}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all shadow-sm ${
        active
          ? 'border-[#6b9a23] bg-[#6b9a23]/5 shadow-[#6b9a23]/10'
          : 'border-[#dde5cb] bg-white hover:border-[#6b9a23]/40'
      }`}
    >
      <div className={`text-sm font-semibold transition-colors ${active ? 'text-[#6b9a23]' : 'text-[#282830]'}`}>{label}</div>
      {desc && <div className="text-xs text-[#9ea0ae] mt-1 leading-snug">{desc}</div>}
    </button>
  )
}

function StravaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3.5">
      <span className="text-xs text-[#9ea0ae] uppercase tracking-wide font-semibold flex-shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-[#282830] text-right font-medium">{value}</span>
    </div>
  )
}

const TIER_STYLES = {
  green:  { bar: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', Icon: Check,        iconBg: 'bg-emerald-500' },
  indigo: { bar: 'bg-[#6b9a23]',  bg: 'bg-[#6b9a23]/5', border: 'border-[#6b9a23]/20', badge: 'bg-[#6b9a23]/10 text-[#6b9a23]', Icon: TrendingUp,  iconBg: 'bg-[#6b9a23]' },
  amber:  { bar: 'bg-amber-400',  bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', Icon: AlertCircle,  iconBg: 'bg-amber-400' },
  red:    { bar: 'bg-red-400',    bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-600', Icon: X,            iconBg: 'bg-red-400' },
}

const SIGNAL_STYLES = {
  positive: { Icon: Check,        color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  warning:  { Icon: AlertCircle,  color: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-400' },
  negative: { Icon: X,            color: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-400' },
}

function ConfidenceIndicator({ confidence }) {
  const { score, label, tier, signals } = confidence
  const style = TIER_STYLES[tier]
  const TierIcon = style.Icon

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-sm ${style.border} ${style.bg}`}>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <p className="text-xs text-[#9ea0ae] uppercase tracking-wide font-semibold mb-1">Indice de réalisabilité</p>
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

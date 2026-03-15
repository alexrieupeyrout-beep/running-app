'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, X } from 'lucide-react'

const INTENSITE_COLORS = {
  'facile':       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'modéré':       { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'intense':      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'récupération': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

const SESSION_SHAPE_COLORS = {
  'Footing léger':       '#02A257',
  'Footing progressif':  '#059669',
  'Sortie longue':       '#2563eb',
  'Fractionné':          '#dc2626',
  'Allure spécifique':   '#d97706',
  'Récupération active': '#7c3aed',
}

const FATIGUE_LEVELS = [
  { value: 1, label: 'Épuisé',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 2, label: 'Fatigué',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 3, label: 'Neutre',   color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  { value: 4, label: 'En forme', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 5, label: 'En feu',   color: '#02A257', bg: '#f0faf5', border: '#c5e6d5' },
]

function NoteField({ note, fatigue, onSave }) {
  const [open, setOpen] = useState(false)
  const [localFatigue, setLocalFatigue] = useState(fatigue || null)
  const hasContent = note || fatigue

  const handleFatigue = async (val) => {
    const newVal = localFatigue === val ? null : val
    setLocalFatigue(newVal)
    onSave({ note, fatigue: newVal })
  }

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '0.72rem', fontWeight: '500', color: hasContent ? '#02A257' : '#b0b3c1' }}
      >
        <span style={{ fontSize: '0.65rem' }}>{open ? '▾' : '▸'}</span>
        {hasContent ? 'Votre ressenti' : 'Ajouter votre ressenti'}
      </button>
      {open && (
        <div style={{ marginTop: '0.65rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {FATIGUE_LEVELS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFatigue(f.value)}
                style={{
                  flex: 1, padding: '0.35rem 0', borderRadius: '8px', border: `1.5px solid ${localFatigue === f.value ? f.border : '#e8e8e8'}`,
                  background: localFatigue === f.value ? f.bg : 'white',
                  color: localFatigue === f.value ? f.color : '#b0b3c1',
                  fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <textarea
            defaultValue={typeof note === 'string' ? note : ''}
            placeholder="Comment s'est passée cette séance ? Tes jambes, ta tête, la météo…"
            onBlur={(e) => onSave({ note: e.target.value, fatigue: localFatigue })}
            style={{ width: '100%', minHeight: '68px', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#464754', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
      )}
    </div>
  )
}

function SessionShape({ type, size = 28 }) {
  const color = SESSION_SHAPE_COLORS[type] || '#9ea0ae'
  const s = size
  const sw = s * 0.12
  if (type === 'Footing léger' || type === 'Footing progressif') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke={color} strokeWidth={sw} /></svg>
  }
  if (type === 'Sortie longue') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="14" rx="12" ry="7" stroke={color} strokeWidth={sw} /></svg>
  }
  if (type === 'Fractionné') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><polyline points="17,3 10,15 15,15 11,25" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></svg>
  }
  if (type === 'Allure spécifique') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><polygon points="14,3 25,14 14,25 3,14" stroke={color} strokeWidth={sw} strokeLinejoin="round" /></svg>
  }
  if (type === 'Récupération active') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M14 5 A9 9 0 1 1 5 14" stroke={color} strokeWidth={sw} strokeLinecap="round" /><polyline points="5,10 5,14 9,14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>
  }
  return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="5" stroke={color} strokeWidth={sw} /></svg>
}

function StravaLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC4C02">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
    </svg>
  )
}

function fmtPaceMin(paceMin) {
  if (!paceMin) return '—'
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin % 1) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

const MOCK_STRAVA = {
  nom: 'Sortie du mardi matin',
  distance_km: 9.2,
  duree_minutes: 51,
  allure_moyenne: 5.52,
  frequence_cardiaque_moy: 158,
  strava_id: 99999,
}

function getActivity(seance, mockOverride = null) {
  if (mockOverride) return { activity: mockOverride, source: 'strava' }
  if (seance.strava_activity) return { activity: seance.strava_activity, source: 'strava' }
  if (seance.manual_activity) return { activity: seance.manual_activity, source: 'manual' }
  return { activity: null, source: null }
}

const DAY_OFFSETS = {
  'Lundi': 0, 'Lun': 0, 'Mardi': 1, 'Mar': 1, 'Mercredi': 2, 'Mer': 2,
  'Jeudi': 3, 'Jeu': 3, 'Vendredi': 4, 'Ven': 4, 'Samedi': 5, 'Sam': 5, 'Dimanche': 6, 'Dim': 6,
}

const T = {
  card:    { background: 'white', border: "1px solid #e8e8e8", borderRadius: '16px' },
  label:   { fontSize: '0.7rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em' },
  primary: { color: '#282830' },
  muted:   { color: '#656779' },
  faint:   { color: '#9ea0ae' },
  green:   { color: '#02A257' },
}

function formatTargetTime(str) {
  if (!str) return str
  str = str.trim().toLowerCase().replace(/\s/g, '')
  let totalMin = null
  const hm = str.match(/(\d+)h(\d+)/)
  if (hm) { totalMin = parseInt(hm[1]) * 60 + parseInt(hm[2]); }
  else { const mm = str.match(/^(\d+):(\d+)$/); if (mm) totalMin = parseInt(mm[1]) + parseInt(mm[2]) / 60 }
  if (totalMin === null) return str
  const h = Math.floor(totalMin / 60)
  const m = Math.round(totalMin % 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

export default function PlanDetailClient({ plan }) {
  const [localSemaines, setLocalSemaines] = useState(plan.semaines || [])
  const [selectedSession, setSelectedSession] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ date: new Date().toISOString().split('T')[0], type_activite: 'Run', distance_km: '', duree_minutes: '', allure_moyenne: '', frequence_cardiaque_moy: '', denivele_positif: '', calories: '', note: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [addError, setAddError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const semaines = localSemaines
  const totalWeeks = semaines.length
  const createdAt = new Date(plan.created_at)
  const today = new Date()
  const weeksPassed = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24 * 7))
  const currentWeekIndex = Math.min(Math.max(weeksPassed, 0), totalWeeks - 1)
  const [selectedWeek, setSelectedWeek] = useState(currentWeekIndex)

  const weekScrollRef = useRef(null)
  const weekPillRefs = useRef([])
  useEffect(() => {
    const pill = weekPillRefs.current[selectedWeek]
    const container = weekScrollRef.current
    if (!pill || !container) return
    const pillLeft = pill.offsetLeft
    const pillRight = pillLeft + pill.offsetWidth
    const containerLeft = container.scrollLeft
    const containerRight = containerLeft + container.offsetWidth
    if (pillLeft < containerLeft) {
      container.scrollTo({ left: pillLeft - 8, behavior: 'smooth' })
    } else if (pillRight > containerRight) {
      container.scrollTo({ left: pillRight - container.offsetWidth + 8, behavior: 'smooth' })
    }
  }, [selectedWeek])

  const raceDate = plan.race_date ? new Date(plan.race_date) : null
  const weeksLeft = raceDate ? Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7)) : null

  const semaine = semaines[selectedWeek]
  if (!semaine) return null

  const weekStart = new Date(createdAt)
  weekStart.setDate(weekStart.getDate() + selectedWeek * 7)
  const dow = weekStart.getDay() === 0 ? 7 : weekStart.getDay()
  const weekMonday = new Date(weekStart)
  weekMonday.setDate(weekStart.getDate() - (dow - 1))
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)
  const fmtDay = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const getSessionDate = (jour) => {
    const offset = DAY_OFFSETS[jour] ?? 0
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + offset)
    return fmtDay(d)
  }

  const handleAddActivity = async () => {
    setAddError(null)
    const activityDate = new Date(addForm.date + 'T12:00:00')
    const todayMidnight = new Date(); todayMidnight.setHours(23, 59, 59, 999)
    if (activityDate > todayMidnight) {
      setAddError("Tu ne peux pas ajouter une activité dans le futur.")
      return
    }
    setAddLoading(true)
    await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const DAY_IDX = { 0: ['dim','dimanche'], 1: ['lun','lundi'], 2: ['mar','mardi'], 3: ['mer','mercredi'], 4: ['jeu','jeudi'], 5: ['ven','vendredi'], 6: ['sam','samedi'] }
    const createdDow = createdAt.getDay() === 0 ? 7 : createdAt.getDay()
    const planMonday = new Date(createdAt)
    planMonday.setDate(createdAt.getDate() - (createdDow - 1))
    planMonday.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((activityDate - planMonday) / (1000 * 60 * 60 * 24))
    const weekIndex = Math.floor(daysDiff / 7)
    const dowActivity = activityDate.getDay()
    const matchingDays = DAY_IDX[dowActivity] || []
    const manualActivity = {
      nom: addForm.note || 'Activité manuelle',
      note: addForm.note || null,
      type_activite: addForm.type_activite,
      distance_km: addForm.distance_km ? parseFloat(addForm.distance_km) : null,
      duree_minutes: addForm.duree_minutes ? parseInt(addForm.duree_minutes) : null,
      allure_moyenne: addForm.allure_moyenne ? parseFloat(addForm.allure_moyenne) : null,
      frequence_cardiaque_moy: addForm.frequence_cardiaque_moy ? parseInt(addForm.frequence_cardiaque_moy) : null,
      denivele_positif: addForm.denivele_positif ? parseInt(addForm.denivele_positif) : null,
      calories: addForm.calories ? parseInt(addForm.calories) : null,
    }
    if (weekIndex >= 0 && weekIndex < localSemaines.length) {
      const week = localSemaines[weekIndex]
      const sessionIndex = week.seances?.findIndex(s => matchingDays.includes(s.jour?.toLowerCase()))
      if (sessionIndex >= 0) {
        setLocalSemaines(prev => prev.map((w, wi) => wi !== weekIndex ? w : {
          ...w,
          seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: true, manual_activity: manualActivity }),
        }))
        await fetch('/api/plan/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: true, manual_activity: manualActivity }),
        })
      }
    }
    setAddLoading(false)
    setAddSuccess(true)
    setTimeout(() => {
      setAddSuccess(false)
      setAddOpen(false)
      setAddForm(f => ({ ...f, distance_km: '', duree_minutes: '', allure_moyenne: '', frequence_cardiaque_moy: '', denivele_positif: '', calories: '', note: '' }))
    }, 1500)
  }

  const deleteActivity = async (weekIndex, sessionIndex) => {
    setLocalSemaines(prev => prev.map((w, wi) => wi !== weekIndex ? w : {
      ...w,
      seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: false, strava_activity: null, manual_activity: null }),
    }))
    await fetch('/api/plan/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: false, strava_activity: null, manual_activity: null }),
    })
    setDeleteConfirm(false)
    setSelectedSession(null)
  }

  const toggleCompleted = async (weekIndex, sessionIndex) => {
    const current = localSemaines[weekIndex].seances[sessionIndex].completed
    const updated = localSemaines.map((w, wi) =>
      wi !== weekIndex ? w : {
        ...w,
        seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !current }),
      }
    )
    setLocalSemaines(updated)
    await fetch('/api/plan/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: !current }),
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f8' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem', height: '52px', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <Link href="/dashboard?tab=plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e8e8e8', background: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <ChevronLeft size={15} color="#464754" />
          </Link>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#282830', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
              {plan.race_name || plan.distance}
            </span>
            {plan.race_name && <span style={{ fontSize: '0.75rem', color: '#b0b3c1', flexShrink: 0 }}>{plan.distance}</span>}
          </div>
          {raceDate && (
            <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: '#9ea0ae', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              {raceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {weeksLeft !== null && weeksLeft > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', background: '#f0faf5', color: '#02A257', border: '1.5px solid #c5e6d5', borderRadius: '99px', padding: '0.15rem 0.55rem', flexShrink: 0 }}>
              J-{weeksLeft * 7}
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
            disabled={selectedWeek === 0}
            style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e8e8e8', background: 'white', cursor: selectedWeek === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={15} color="#464754" />
          </button>
          <div ref={weekScrollRef} style={{ flex: 1, display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', justifyContent: totalWeeks <= 8 ? 'center' : 'flex-start' }}>
          {semaines.map((s, i) => {
            const totalSeances = s.seances?.length || 0
            const doneSeances = s.seances?.filter(se => se.completed || se.strava_activity || se.manual_activity).length || 0
            const allDone = doneSeances === totalSeances && totalSeances > 0
            const hasSome = doneSeances > 0
            const isSelected = i === selectedWeek
            const isCurrent = i === currentWeekIndex
            return (
              <button
                key={i}
                ref={el => weekPillRefs.current[i] = el}
                onClick={() => setSelectedWeek(i)}
                style={{
                  flexShrink: 0,
                  position: 'relative',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1.5px solid',
                  background: isSelected ? '#02A257' : 'white',
                  borderColor: isSelected ? '#02A257' : isCurrent ? '#02A257' : '#e8e8e8',
                  transition: 'all 0.15s',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isSelected ? 'white' : isCurrent ? '#02A257' : '#282830' }}>
                  S{i + 1}
                </span>
                {allDone && !isSelected && (
                  <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', color: '#02A257' }}>✓</span>
                )}
                {hasSome && !allDone && !isSelected && (
                  <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '2px', borderRadius: '99px', background: '#02A257', opacity: 0.5 }} />
                )}
              </button>
            )
          })}
          </div>
          <button
            onClick={() => setSelectedWeek(w => Math.min(totalWeeks - 1, w + 1))}
            disabled={selectedWeek === totalWeeks - 1}
            style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e8e8e8', background: 'white', cursor: selectedWeek === totalWeeks - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === totalWeeks - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={15} color="#464754" />
          </button>
        </div>

        {/* Session modal */}
        {selectedSession && (() => {
          const { weekIndex, sessionIndex } = selectedSession
          const s = localSemaines[weekIndex]?.seances?.[sessionIndex]
          if (!s) return null
          const colors = INTENSITE_COLORS[s.intensite] || INTENSITE_COLORS['modéré']
          const done = !!s.completed
          const { activity: strava, source: stravaSource } = getActivity(s, sessionIndex === 0 && weekIndex === 0 ? MOCK_STRAVA : null)
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1rem' }}
              onClick={() => { setSelectedSession(null); setDeleteConfirm(false) }}
            >
              <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(28,28,36,0.2)' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <SessionShape type={s.type} size={32} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#282830' }}>{s.type}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ea0ae', marginTop: '0.1rem' }}>{s.jour} · {getSessionDate(s.jour)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '6px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{s.intensite}</span>
                    <button onClick={() => setSelectedSession(null)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#9ea0ae" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Séance {sessionIndex + 1}</div>
                  {s.description && <p style={{ fontSize: '0.9rem', color: '#464754', lineHeight: 1.55, marginBottom: '1rem' }}>{s.description}</p>}
                  {/* Stats prévues */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Distance', value: `${s.distance_km} km` },
                      { label: 'Durée', value: `${s.duree_minutes} min` },
                      { label: 'Allure cible', value: s.allure_cible || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {s.details && (
                    <div style={{ background: '#f0faf5', border: '1px solid #c5e6d5', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#02A257', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>Instructions</div>
                      <p style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.55, margin: 0 }}>{s.details}</p>
                    </div>
                  )}
                  {/* Notes */}
                  <NoteField
                    note={typeof s.note === 'string' && s.note !== '[object Object]' ? s.note : ''}
                    fatigue={s.fatigue || null}
                    onSave={async ({ note, fatigue }) => {
                      const semaines = [...localSemaines]
                      semaines[weekIndex].seances[sessionIndex].note = note
                      semaines[weekIndex].seances[sessionIndex].fatigue = fatigue
                      setLocalSemaines(semaines)
                      await fetch('/api/plan/session', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, note, fatigue }),
                      })
                    }}
                  />
                  {/* Mark as done */}
                  {!strava ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => toggleCompleted(weekIndex, sessionIndex)}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '99px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s', background: done ? '#f0fdf4' : '#02A257', color: done ? '#16a34a' : 'white', border: `1.5px solid ${done ? '#bbf7d0' : '#02A257'}` }}
                      >
                        {done ? 'Réalisée — annuler' : 'Marquer comme réalisée'}
                      </button>
                    </div>
                  ) : null}
                  {/* Activity block */}
                  {strava && (
                    <div style={{ marginTop: '1rem', borderRadius: '14px', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}`, overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stravaSource === 'strava' ? '#FC4C02' : '#02A257' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {stravaSource === 'strava' ? <StravaLogo size={16} /> : <CheckCircle2 size={16} color="white" />}
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'white' }}>{stravaSource === 'strava' ? 'Activité synchronisée' : 'Saisie manuelle'}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>{strava.nom}</span>
                      </div>
                      <div style={{ background: '#fafafa', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {[
                            { label: 'Distance', prevu: `${s.distance_km} km`, reel: `${strava.distance_km} km`, better: strava.distance_km >= s.distance_km },
                            { label: 'Durée', prevu: `${s.duree_minutes} min`, reel: `${strava.duree_minutes} min`, better: strava.duree_minutes <= s.duree_minutes },
                            ...(strava.allure_moyenne ? [{ label: 'Allure moy.', prevu: s.allure_cible || '—', reel: fmtPaceMin(strava.allure_moyenne), better: null }] : []),
                            ...(strava.frequence_cardiaque_moy ? [{ label: 'FC moy.', prevu: '—', reel: `${strava.frequence_cardiaque_moy} bpm`, better: null }] : []),
                            ...(strava.denivele_positif ? [{ label: 'Dénivelé', prevu: '—', reel: `+${strava.denivele_positif} m`, better: null }] : []),
                            ...(strava.calories ? [{ label: 'Calories', prevu: '—', reel: `${strava.calories} kcal`, better: null }] : []),
                          ].map(({ label, prevu, reel, better }) => (
                            <div key={label} style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 0.75rem', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}` }}>
                              <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{label}</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: better === null ? '#282830' : better ? '#02A257' : '#dc2626' }}>{reel}</span>
                                {prevu !== '—' && <span style={{ fontSize: '0.7rem', color: '#b0b3c1' }}>/ {prevu} prévu</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {strava.note && (
                          <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: 'white', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}` }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Note</div>
                            <div style={{ fontSize: '0.84rem', color: '#464754' }}>{strava.note}</div>
                          </div>
                        )}
                        {/* Supprimer l'activité */}
                        {!deleteConfirm ? (
                          <button
                            onClick={() => setDeleteConfirm(true)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px solid #fecaca', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', color: '#dc2626', marginBottom: stravaSource === 'strava' && strava.strava_id ? '0.75rem' : '0' }}
                          >
                            Supprimer l'activité
                          </button>
                        ) : (
                          <div style={{ marginBottom: stravaSource === 'strava' && strava.strava_id ? '0.75rem' : '0', padding: '0.75rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>Supprimer cette activité ?</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ea0ae', marginBottom: '0.65rem' }}>La séance repassera en "non réalisée".</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', color: '#656779' }}>Annuler</button>
                              <button onClick={() => deleteActivity(weekIndex, sessionIndex)} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: 'none', background: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: 'white' }}>Confirmer</button>
                            </div>
                          </div>
                        )}
                        {stravaSource === 'strava' && strava.strava_id && (
                          <a href={`https://www.strava.com/activities/${strava.strava_id}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#FC4C02', fontWeight: '600', textDecoration: 'none' }}>
                            <StravaLogo size={12} /> Voir sur Strava →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Week detail */}
        <div style={{ ...T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: "1px solid #f0f0f0", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', ...T.primary }}>{semaine.theme}</div>
              <div style={{ fontSize: '0.75rem', ...T.faint, marginTop: '0.2rem' }}>{fmtDay(weekMonday)} → {fmtDay(weekSunday)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', ...T.green, fontSize: '1.1rem' }}>{(semaine.seances || []).reduce((sum, s) => sum + (s.distance_km || 0), 0)} km</div>
              <div style={{ fontSize: '0.75rem', ...T.faint }}>{semaine.seances?.length} séances</div>
            </div>
          </div>

          {/* Stats rapides */}
          {(() => {
            const seances = semaine.seances || []
            const withActivity = seances.map((se, i) => {
              const { activity } = getActivity(se, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
              return { ...se, _activity: activity }
            })
            const done = withActivity.filter(se => se.completed || se._activity)
            if (done.length === 0) return null
            const kmPrevus = seances.reduce((sum, se) => sum + (se.distance_km || 0), 0)
            const kmRealises = done.reduce((sum, se) => { const km = se._activity?.distance_km ?? se.distance_km ?? 0; return sum + km }, 0)
            const minRealises = done.reduce((sum, se) => sum + (se._activity?.duree_minutes ?? se.duree_minutes ?? 0), 0)
            const h = Math.floor(minRealises / 60)
            const m = minRealises % 60
            const dureeStr = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
            const allDone = done.length === seances.length
            return (
              <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #f0f0f0' }}>
                {allDone && (
                  <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}><CheckCircle2 size={28} color="#02A257" /></div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#02A257', marginBottom: '0.5rem' }}>Semaine {selectedWeek + 1} complète !</div>
                    {(() => {
                      const kmRnd = done.reduce((s, se) => s + (se._activity?.distance_km ?? se.distance_km ?? 0), 0).toFixed(1)
                      const minTot = done.reduce((s, se) => s + (se._activity?.duree_minutes ?? se.duree_minutes ?? 0), 0)
                      const h = Math.floor(minTot / 60), m = minTot % 60
                      const duree = h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`
                      return (
                        <div style={{ marginTop: '0.5rem', padding: '0.85rem 1.1rem', borderRadius: '12px', background: '#f7f7f8', borderLeft: '3px solid #02A257' }}>
                          <div style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.65, textAlign: 'left' }}>
                            <strong style={{ color: '#282830' }}>{done.length} séances</strong> bouclées, <strong style={{ color: '#282830' }}>{kmRnd} km</strong> au compteur et <strong style={{ color: '#282830' }}>{duree}</strong> sur les jambes. Belle semaine, continue comme ça !
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <div style={{ background: '#f7f7f8', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Séances</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#282830' }}>{done.length}<span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#9ea0ae' }}>/{seances.length}</span></div>
                  </div>
                  <div style={{ background: '#f0faf5', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Distance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#02A257' }}>{kmRealises.toFixed(1)}<span style={{ fontSize: '0.72rem', fontWeight: '500', color: '#9ea0ae' }}> km</span></div>
                  </div>
                  <div style={{ background: '#f7f7f8', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Durée</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#282830' }}>{dureeStr}</div>
                  </div>
                </div>

              </div>
            )
          })()}

          {/* Sessions */}
          <div>
            {(semaine.seances || []).map((seance, i) => {
              const colors = INTENSITE_COLORS[seance.intensite] || INTENSITE_COLORS['modéré']
              const done = !!seance.completed
              const { activity: strava, source: stravaSource } = getActivity(seance, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
              const actColor = stravaSource === 'strava' ? '#FC4C02' : '#02A257'
              return (
                <div
                  key={i}
                  onClick={() => setSelectedSession({ weekIndex: selectedWeek, sessionIndex: i, seance })}
                  style={{ padding: '1rem 1.5rem', borderBottom: i < semaine.seances.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                >
                  <div style={{ flexShrink: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SessionShape type={seance.type} size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                      {seance.jour?.slice(0, 3)} · {getSessionDate(seance.jour)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: (strava || done) ? '#b0b3c1' : '#282830' }}>{seance.type}</span>
                      {stravaSource === 'strava' && <StravaLogo size={12} />}
                      {stravaSource === 'manual' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      )}
                      {done && !strava && <CheckCircle2 size={12} color="#16a34a" />}
                      {!(strava || done) && (
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{seance.intensite}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {(strava || done) ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                        <CheckCircle2 size={11} /> Réalisée
                      </span>
                    ) : (
                      <>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830' }}>{seance.distance_km} km</div>
                        {seance.allure_cible && ['Footing léger', 'Récupération active'].includes(seance.type) && <div style={{ fontSize: '0.75rem', ...T.green, fontWeight: '600' }}>{seance.allure_cible}</div>}
                        {seance.duree_minutes && <div style={{ fontSize: '0.72rem', ...T.faint }}>{seance.duree_minutes >= 60 ? `${Math.floor(seance.duree_minutes / 60)}h${String(seance.duree_minutes % 60).padStart(2, '0')}` : `${seance.duree_minutes} min`}</div>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ajouter une activité */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => { setAddOpen(o => !o); setAddSuccess(false); setAddError(null) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '99px', border: "1px solid #e8e8e8", background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#656779' }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1, color: '#02A257' }}>+</span>
            Ajouter une activité
          </button>
        </div>

        {addOpen && (
          <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 8px 40px rgba(28,28,36,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#282830' }}>Ajouter une activité</div>
                <button onClick={() => setAddOpen(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#9ea0ae" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Date</label>
                  <input type="date" value={addForm.date} max={new Date().toISOString().split('T')[0]} onChange={e => { setAddError(null); setAddForm(f => ({ ...f, date: e.target.value })) }}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Type</label>
                  <select value={addForm.type_activite} onChange={e => setAddForm(f => ({ ...f, type_activite: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}>
                    {[['Run','🏃 Course'],['Ride','🚴 Vélo'],['Walk','🚶 Marche / Randonnée'],['Swim','🏊 Natation'],['WeightTraining','💪 Renforcement'],['Workout','💪 Workout'],['Yoga','🧘 Yoga'],['Rowing','🚣 Aviron']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Distance (km)</label>
                  <input type="number" min="0" step="0.1" placeholder="ex: 8.5" value={addForm.distance_km} onChange={e => setAddForm(f => ({ ...f, distance_km: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Durée (min)</label>
                  <input type="number" min="0" placeholder="ex: 45" value={addForm.duree_minutes} onChange={e => setAddForm(f => ({ ...f, duree_minutes: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Allure (min/km)</label>
                  <input type="number" min="0" step="0.01" placeholder="ex: 5.30" value={addForm.allure_moyenne} onChange={e => setAddForm(f => ({ ...f, allure_moyenne: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>FC moy. (bpm)</label>
                  <input type="number" min="0" placeholder="ex: 155" value={addForm.frequence_cardiaque_moy} onChange={e => setAddForm(f => ({ ...f, frequence_cardiaque_moy: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Dénivelé (m)</label>
                  <input type="number" min="0" placeholder="ex: 250" value={addForm.denivele_positif} onChange={e => setAddForm(f => ({ ...f, denivele_positif: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Calories (kcal)</label>
                  <input type="number" min="0" placeholder="ex: 480" value={addForm.calories} onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Note</label>
                  <input type="text" placeholder="ex: Sortie cool" value={addForm.note} onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
              </div>
              {addError && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.82rem', color: '#dc2626', fontWeight: '500' }}>
                  {addError}
                </div>
              )}
              <button
                onClick={handleAddActivity}
                disabled={addLoading || addSuccess || (!addForm.distance_km && !addForm.duree_minutes)}
                style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: addLoading || addSuccess ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', background: addSuccess ? '#f0fdf4' : '#02A257', color: addSuccess ? '#16a34a' : 'white', opacity: (!addForm.distance_km && !addForm.duree_minutes) ? 0.5 : 1 }}>
                {addSuccess ? '✓ Activité enregistrée !' : addLoading ? 'Enregistrement...' : "Enregistrer l'activité"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

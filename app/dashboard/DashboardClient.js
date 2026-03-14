'use client'
import Graphique from './Graphique'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, RefreshCw, XCircle, CheckCircle2, Circle, X } from 'lucide-react'

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

function SessionShape({ type, size = 28 }) {
  const color = SESSION_SHAPE_COLORS[type] || '#9ea0ae'
  const s = size
  const sw = s * 0.12  // stroke width proportionnel

  if (type === 'Footing léger' || type === 'Footing progressif') {
    // Cercle outline
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="10" stroke={color} strokeWidth={sw} />
      </svg>
    )
  }
  if (type === 'Sortie longue') {
    // Ovale allongé horizontal
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
        <ellipse cx="14" cy="14" rx="12" ry="7" stroke={color} strokeWidth={sw} />
      </svg>
    )
  }
  if (type === 'Fractionné') {
    // Éclair
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
        <polyline points="17,3 10,15 15,15 11,25" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'Allure spécifique') {
    // Losange
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
        <polygon points="14,3 25,14 14,25 3,14" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
      </svg>
    )
  }
  if (type === 'Récupération active') {
    // Spirale / arc double
    return (
      <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
        <path d="M14 5 A9 9 0 1 1 5 14" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        <polyline points="5,10 5,14 9,14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  // Fallback : carré arrondi
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="5" stroke={color} strokeWidth={sw} />
    </svg>
  )
}

const ACTIVITY_ICONS = {
  'Run':           '🏃',
  'Ride':          '🚴',
  'VirtualRide':   '🚴',
  'Walk':          '🚶',
  'Hike':          '🚶',
  'Swim':          '🏊',
  'WeightTraining':'💪',
  'Yoga':          '🧘',
  'Workout':       '💪',
  'EBikeRide':     '🚴',
  'Rowing':        '🚣',
}
function activityIcon(type) { return ACTIVITY_ICONS[type] || '🏃' }

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

// Mock strava activity pour démo UI — à retirer quand le matching sera réel
const MOCK_STRAVA = {
  nom: 'Sortie du mardi matin',
  distance_km: 9.2,
  duree_minutes: 51,
  allure_moyenne: 5.52,
  frequence_cardiaque_moy: 158,
  strava_id: 99999,
}

// Retourne { activity, source } selon la source disponible
function getActivity(seance, mockOverride = null) {
  if (mockOverride) return { activity: mockOverride, source: 'strava' }
  if (seance.strava_activity) return { activity: seance.strava_activity, source: 'strava' }
  if (seance.manual_activity) return { activity: seance.manual_activity, source: 'manual' }
  return { activity: null, source: null }
}

// ── Shared style tokens ──────────────────────────────────────
const T = {
  card:    { background: 'white', border: '1px solid #c5e6d5', borderRadius: '16px' },
  label:   { fontSize: '0.7rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em' },
  primary: { color: '#282830' },
  muted:   { color: '#656779' },
  faint:   { color: '#9ea0ae' },
  green:   { color: '#02A257' },
}

function PlanSection({ plan, onAbandon }) {
  const router = useRouter()
  const [localSemaines, setLocalSemaines] = useState(plan.semaines || [])
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ date: new Date().toISOString().split('T')[0], type_activite: 'Run', distance_km: '', duree_minutes: '', frequence_cardiaque_moy: '', note: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)

  const handleAddActivity = async () => {
    setAddLoading(true)

    // 1. Sauvegarder dans courses
    await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })

    // 2. Trouver la séance correspondante par date
    const DAY_IDX = { 0: ['dim','dimanche'], 1: ['lun','lundi'], 2: ['mar','mardi'], 3: ['mer','mercredi'], 4: ['jeu','jeudi'], 5: ['ven','vendredi'], 6: ['sam','samedi'] }
    // Utiliser midi pour éviter les décalages UTC
    const activityDate = new Date(addForm.date + 'T12:00:00')
    const createdAt = new Date(plan.created_at)
    // Calculer le lundi de la semaine de création (même logique que l'affichage)
    const createdDow = createdAt.getDay() === 0 ? 7 : createdAt.getDay()
    const planMonday = new Date(createdAt)
    planMonday.setDate(createdAt.getDate() - (createdDow - 1))
    planMonday.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((activityDate - planMonday) / (1000 * 60 * 60 * 24))
    const weekIndex = Math.floor(daysDiff / 7)
    const dow = activityDate.getDay()
    const matchingDays = DAY_IDX[dow] || []

    const manualActivity = {
      nom: addForm.note || `Activité manuelle`,
      type_activite: addForm.type_activite,
      distance_km: addForm.distance_km ? parseFloat(addForm.distance_km) : null,
      duree_minutes: addForm.duree_minutes ? parseInt(addForm.duree_minutes) : null,
      frequence_cardiaque_moy: addForm.frequence_cardiaque_moy ? parseInt(addForm.frequence_cardiaque_moy) : null,
    }

    if (weekIndex >= 0 && weekIndex < localSemaines.length) {
      const week = localSemaines[weekIndex]
      const sessionIndex = week.seances?.findIndex(s => matchingDays.includes(s.jour?.toLowerCase()))

      if (sessionIndex >= 0) {
        // Mise à jour optimiste
        setLocalSemaines(prev => {
          const updated = prev.map((w, wi) => wi !== weekIndex ? w : {
            ...w,
            seances: w.seances.map((s, si) => si !== sessionIndex ? s : {
              ...s, completed: true, manual_activity: manualActivity,
            }),
          })
          return updated
        })

        // Persistance en base
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
      setAddForm(f => ({ ...f, distance_km: '', duree_minutes: '', frequence_cardiaque_moy: '', note: '' }))
    }, 1500)
  }

  const semaines = localSemaines
  const totalWeeks = semaines.length

  const createdAt = new Date(plan.created_at)
  const today = new Date()
  const weeksPassed = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24 * 7))
  const currentWeekIndex = Math.min(Math.max(weeksPassed, 0), totalWeeks - 1)

  const [selectedWeek, setSelectedWeek] = useState(currentWeekIndex)
  const semaine = semaines[selectedWeek]
  if (!semaine) return null

  const raceDate = plan.race_date ? new Date(plan.race_date) : null
  const weeksLeft = raceDate ? Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7)) : null
  const totalSessions = localSemaines.reduce((sum, w) => sum + (w.seances?.length || 0), 0)
  const completedSessions = localSemaines.reduce((sum, w) => sum + (w.seances?.filter(s => s.completed || getActivity(s).activity !== null).length || 0), 0)
  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

  // Dates de la semaine sélectionnée
  const DAY_OFFSETS = {
    'Lundi': 0, 'Lun': 0,
    'Mardi': 1, 'Mar': 1,
    'Mercredi': 2, 'Mer': 2,
    'Jeudi': 3, 'Jeu': 3,
    'Vendredi': 4, 'Ven': 4,
    'Samedi': 5, 'Sam': 5,
    'Dimanche': 6, 'Dim': 6,
  }
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
  const confidence = computePlanConfidence(plan)
  const confStyle = CONF_TIERS[confidence.tier]

  const toggleCompleted = async (weekIndex, sessionIndex) => {
    const current = localSemaines[weekIndex].seances[sessionIndex].completed
    const updated = localSemaines.map((w, wi) =>
      wi !== weekIndex ? w : {
        ...w,
        seances: w.seances.map((s, si) =>
          si !== sessionIndex ? s : { ...s, completed: !current }
        ),
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Plan header card */}
      <div style={{ ...T.card, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <div style={{ ...T.label }}>Plan actif</div>
              {/* Gérer menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: '6px', border: '1px solid #c5e6d5', background: menuOpen ? '#f0faf5' : 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600', color: '#9ea0ae', letterSpacing: '0.05em' }}
                >
                  <Settings size={11} color="#9ea0ae" />
                  GÉRER
                </button>
                {menuOpen && (
                  <>
                    <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, background: 'white', border: '1px solid #c5e6d5', borderRadius: '12px', boxShadow: '0 6px 20px rgba(40,40,48,0.1)', minWidth: '190px', overflow: 'hidden' }}>
                      <Link
                        href="/onboarding"
                        onClick={() => setMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '500', color: '#282830', borderBottom: '1px solid #f0f0f0' }}
                      >
                        <Settings size={14} color="#9ea0ae" />
                        Modifier le plan
                      </Link>
                      <Link
                        href="/onboarding"
                        onClick={() => setMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '500', color: '#282830', borderBottom: '1px solid #f0f0f0' }}
                      >
                        <RefreshCw size={14} color="#9ea0ae" />
                        Nouveau plan
                      </Link>
                      <button
                        onClick={() => { setMenuOpen(false); onAbandon(plan.id) }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.84rem', fontWeight: '500', color: '#dc2626', textAlign: 'left' }}
                      >
                        <XCircle size={14} color="#dc2626" />
                        Abandonner le plan
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', ...T.primary }}>
              {plan.distance}{plan.race_name ? ` — ${plan.race_name}` : ''}
            </div>
            {raceDate && (
              <div style={{ fontSize: '0.8rem', ...T.muted, marginTop: '0.2rem' }}>
                📅 {raceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {weeksLeft !== null && weeksLeft > 0 && (
                  <span style={{ marginLeft: '0.5rem', ...T.green, fontWeight: '600' }}>· J-{weeksLeft * 7}</span>
                )}
              </div>
            )}
          </div>
          {plan.target_time && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...T.label, marginBottom: '0.2rem' }}>Votre objectif</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', ...T.green, fontVariantNumeric: 'tabular-nums' }}>{formatTargetTime(plan.target_time)}</div>
            </div>
          )}
        </div>
        {/* Progress bar */}
        <div style={{ height: '6px', background: '#daf0e8', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#02A257', borderRadius: '99px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', ...T.faint }}>
          <span>Début</span>
          <span style={{ ...T.green, fontWeight: '600' }}>{completedSessions}/{totalSessions} séances · {progress}%</span>
          <span>Course</span>
        </div>

        {/* Confidence strip */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #daf0e8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ ...T.label }}>Indice de confiance</span>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: confStyle.text, background: confStyle.bg, border: `1px solid ${confStyle.border}`, borderRadius: '6px', padding: '0.1rem 0.5rem' }}>
                {confidence.label} · {confidence.score}/100
              </span>
            </div>
            <div style={{ height: '5px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confidence.score}%`, background: confStyle.bar, borderRadius: '99px', transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#b0b3c1', fontStyle: 'italic' }}>
              Se mettra à jour au fil de tes séances validées
            </div>
          </div>
        </div>
      </div>


      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
          disabled={selectedWeek === 0}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #c5e6d5', background: 'white', cursor: selectedWeek === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === 0 ? 0.3 : 1, flexShrink: 0 }}
        >
          <ChevronLeft size={16} color="#464754" />
        </button>
        <div style={{ flex: 1, display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {semaines.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedWeek(i)}
              style={{
                flexShrink: 0, padding: '0.3rem 0.7rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: '1px solid',
                background: i === selectedWeek ? '#02A257' : i === currentWeekIndex ? '#f0faf5' : 'white',
                color:      i === selectedWeek ? 'white'   : i === currentWeekIndex ? '#02A257' : '#9ea0ae',
                borderColor:i === selectedWeek ? '#02A257' : i === currentWeekIndex ? '#02A257' : '#c5e6d5',
              }}
            >
              S{i + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSelectedWeek(w => Math.min(totalWeeks - 1, w + 1))}
          disabled={selectedWeek === totalWeeks - 1}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #c5e6d5', background: 'white', cursor: selectedWeek === totalWeeks - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === totalWeeks - 1 ? 0.3 : 1, flexShrink: 0 }}
        >
          <ChevronRight size={16} color="#464754" />
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
            onClick={() => setSelectedSession(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '1.5rem', boxShadow: '0 8px 40px rgba(28,28,36,0.2)', maxHeight: '90vh', overflowY: 'auto' }}
            >

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SessionShape type={s.type} size={36} /></div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#282830' }}>{s.type}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9ea0ae', marginTop: '0.1rem' }}>
                      {s.jour} · {getSessionDate(s.jour)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                    {s.intensite}
                  </span>
                  <button onClick={() => setSelectedSession(null)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={14} color="#9ea0ae" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: ['Footing léger', 'Récupération active'].includes(s.type) ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Distance', value: `${s.distance_km} km` },
                  { label: 'Durée', value: `${s.duree_minutes} min` },
                  ...(['Footing léger', 'Récupération active'].includes(s.type) ? [{ label: 'Allure cible', value: s.allure_cible || '—' }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#f8faf9', border: '1px solid #e8f4ee', borderRadius: '12px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#282830' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {s.description && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#464754', lineHeight: 1.55 }}>{s.description}</p>
                </div>
              )}

              {/* Instructions */}
              {s.details && (
                <div style={{ background: '#f0faf5', border: '1px solid #c5e6d5', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#02A257', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>Instructions</div>
                  <p style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.55, margin: 0 }}>{s.details}</p>
                </div>
              )}

              {/* Mark as done */}
              {stravaSource === 'strava' ? (
                <div style={{ width: '100%', padding: '0.85rem', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  background: '#fff1ec', border: '1px solid #fdd0b8' }}>
                  <StravaLogo size={15} />
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#FC4C02' }}>Réalisée via Strava</span>
                </div>
              ) : !strava ? (
                <button
                  onClick={() => { toggleCompleted(weekIndex, sessionIndex) }}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.15s',
                    background: done ? '#f0fdf4' : '#02A257',
                    color: done ? '#16a34a' : 'white',
                    boxShadow: done ? 'none' : '0 2px 8px rgba(2,162,87,0.3)',
                  }}
                >
                  {done
                    ? <><CheckCircle2 size={17} /> Séance réalisée — annuler</>
                    : <><Circle size={17} /> Marquer comme réalisée</>
                  }
                </button>
              ) : null}

              {/* Strava section */}
              {strava ? (
                <div style={{ marginTop: '1rem', borderRadius: '14px', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}`, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stravaSource === 'strava' ? '#FC4C02' : '#02A257' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {stravaSource === 'strava' ? <StravaLogo size={16} /> : <CheckCircle2 size={16} color="white" />}
                      <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'white' }}>{stravaSource === 'strava' ? 'Activité synchronisée' : 'Saisie manuelle'}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>{strava.nom}</span>
                  </div>
                  {/* Comparatif prévu / réalisé */}
                  <div style={{ background: stravaSource === 'strava' ? '#fff9f6' : '#f0faf5', padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[
                        { label: 'Distance', prevu: `${s.distance_km} km`, reel: `${strava.distance_km} km`, better: strava.distance_km >= s.distance_km },
                        { label: 'Durée', prevu: `${s.duree_minutes} min`, reel: `${strava.duree_minutes} min`, better: strava.duree_minutes <= s.duree_minutes },
                        ...(strava.allure_moyenne ? [{ label: 'Allure moy.', prevu: s.allure_cible || '—', reel: fmtPaceMin(strava.allure_moyenne), better: null }] : []),
                        ...(strava.frequence_cardiaque_moy ? [{ label: 'FC moyenne', prevu: '—', reel: `${strava.frequence_cardiaque_moy} bpm`, better: null }] : []),
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
                    {stravaSource === 'strava' && strava.strava_id && (
                      <a
                        href={`https://www.strava.com/activities/${strava.strava_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#FC4C02', fontWeight: '600', textDecoration: 'none' }}
                      >
                        <StravaLogo size={12} /> Voir sur Strava →
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fafafa', opacity: 0.55 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FC4C02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <StravaLogo size={12} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#464754' }}>Activité Strava associée</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ea0ae' }}>Synchronisation automatique — bientôt disponible</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* Week detail */}
      <div style={{ ...T.card, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #daf0e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ ...T.label }}>
              Semaine {semaine.numero}{selectedWeek === currentWeekIndex ? ' · Cette semaine' : ''}
            </div>
            <div style={{ fontWeight: '700', ...T.primary, marginTop: '0.15rem' }}>{semaine.theme}</div>
            <div style={{ fontSize: '0.75rem', ...T.faint, marginTop: '0.2rem' }}>
              {fmtDay(weekMonday)} → {fmtDay(weekSunday)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', ...T.green, fontSize: '1.1rem' }}>{(semaine.seances || []).reduce((sum, s) => sum + (s.distance_km || 0), 0)} km</div>
            <div style={{ fontSize: '0.75rem', ...T.faint }}>{semaine.seances?.length} séances</div>
          </div>
        </div>

        {/* Stats rapides semaine */}
        {(() => {
          const seances = semaine.seances || []
          // Mock strava sur S1/séance 0 pour démo
          const withActivity = seances.map((se, i) => {
            const { activity } = getActivity(se, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
            return { ...se, _activity: activity }
          })
          const done = withActivity.filter(se => se.completed || se._activity)
          if (done.length === 0) return null

          const kmPrevus = seances.reduce((sum, se) => sum + (se.distance_km || 0), 0)
          const kmRealises = done.reduce((sum, se) => {
            const km = se._activity?.distance_km ?? se.distance_km ?? 0
            return sum + km
          }, 0)
          const minRealises = done.reduce((sum, se) => {
            return sum + (se._activity?.duree_minutes ?? se.duree_minutes ?? 0)
          }, 0)
          const h = Math.floor(minRealises / 60)
          const m = minRealises % 60
          const dureeStr = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`

          return (
            <div style={{ padding: '0.75rem 1.5rem', background: '#f8fdf9', borderBottom: '1px solid #daf0e8', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} color="#02A257" />
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#282830' }}>{done.length}/{seances.length}</span>
                <span style={{ fontSize: '0.75rem', color: '#9ea0ae' }}>séances</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#282830' }}>{kmRealises.toFixed(1)} km</span>
                <span style={{ fontSize: '0.75rem', color: '#9ea0ae' }}>/ {kmPrevus} km</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#282830' }}>{dureeStr}</span>
                <span style={{ fontSize: '0.75rem', color: '#9ea0ae' }}>total</span>
              </div>
            </div>
          )
        })()}
        <div>
          {(semaine.seances || []).map((seance, i) => {
            const colors = INTENSITE_COLORS[seance.intensite] || INTENSITE_COLORS['modéré']
            const done = !!seance.completed
            const { activity: strava, source: stravaSource } = getActivity(seance, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
            const actColor = stravaSource === 'strava' ? '#FC4C02' : '#02A257'
            const actBg    = stravaSource === 'strava' ? '#fff9f6' : '#f0faf5'
            return (
              <div
                key={i}
                onClick={() => setSelectedSession({ weekIndex: selectedWeek, sessionIndex: i, seance })}
                style={{ padding: '1rem 1.5rem', borderBottom: i < semaine.seances.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start', cursor: 'pointer', background: strava ? actBg : done ? '#f0faf5' : 'white', transition: 'background 0.15s' }}
                onMouseEnter={e => { if (!strava && !done) e.currentTarget.style.background = '#fafafa' }}
                onMouseLeave={e => { e.currentTarget.style.background = strava ? actBg : done ? '#f0faf5' : 'white' }}
              >
                <div style={{ width: '44px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: strava ? actColor : done ? '#02A257' : T.green.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{seance.jour?.slice(0, 3)}</div>
                  <div style={{ marginTop: '0.1rem', opacity: done && !strava ? 0.4 : 1, display: 'flex', justifyContent: 'center' }}><SessionShape type={seance.type} size={22} /></div>
                  <div style={{ fontSize: '0.6rem', ...T.faint, marginTop: '0.15rem', lineHeight: 1.2 }}>{getSessionDate(seance.jour)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#282830' }}>{seance.type}</span>
                    {strava ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px',
                        background: stravaSource === 'strava' ? '#fff1ec' : '#f0fdf4',
                        color: stravaSource === 'strava' ? '#FC4C02' : '#16a34a',
                        border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#bbf7d0'}` }}>
                        {stravaSource === 'strava' ? <StravaLogo size={10} /> : <CheckCircle2 size={10} />}
                        {stravaSource === 'strava' ? 'Strava' : 'Manuel'}
                      </span>
                    ) : !done ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                        {seance.intensite}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                        Réalisée ✓
                      </span>
                    )}
                  </div>
                  {strava ? (
                    <div style={{ fontSize: '0.78rem', color: '#9ea0ae', display: 'flex', gap: '0.75rem' }}>
                      <span style={{ color: '#464754', fontWeight: '600' }}>{strava.distance_km} km</span>
                      <span>{strava.duree_minutes} min</span>
                      {strava.frequence_cardiaque_moy && <span>FC {strava.frequence_cardiaque_moy} bpm</span>}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: done ? '#b0b3c1' : '#656779' }}>{seance.description}</div>
                  )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  {strava ? (
                    <>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#FC4C02' }}>{strava.distance_km} km</div>
                      <div style={{ fontSize: '0.72rem', color: '#9ea0ae', textDecoration: 'line-through' }}>{seance.distance_km} km prévu</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem', color: done ? '#9ea0ae' : '#282830' }}>{seance.distance_km} km</div>
                      {seance.allure_cible && !done && ['Footing léger', 'Récupération active'].includes(seance.type) && <div style={{ fontSize: '0.75rem', ...T.green, fontWeight: '600' }}>{seance.allure_cible}</div>}
                      {seance.duree_minutes && <div style={{ fontSize: '0.72rem', ...T.faint }}>{seance.duree_minutes} min</div>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Ajouter une activité ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={() => { setAddOpen(o => !o); setAddSuccess(false) }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '99px', border: '1px solid #c5e6d5', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#656779' }}
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
              <input type="date" value={addForm.date} onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Type</label>
              <select value={addForm.type_activite} onChange={e => setAddForm(f => ({ ...f, type_activite: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}>
                {[['Run','🏃 Course'],['Ride','🚴 Vélo'],['Walk','🚶 Marche / Randonnée'],['Swim','🏊 Natation'],['WeightTraining','💪 Renforcement'],['Workout','💪 Workout'],['Yoga','🧘 Yoga'],['Rowing','🚣 Aviron']].map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Distance (km)</label>
              <input type="number" min="0" step="0.1" placeholder="ex: 8.5" value={addForm.distance_km} onChange={e => setAddForm(f => ({ ...f, distance_km: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Durée (min)</label>
              <input type="number" min="0" placeholder="ex: 45" value={addForm.duree_minutes} onChange={e => setAddForm(f => ({ ...f, duree_minutes: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>FC moyenne (bpm)</label>
              <input type="number" min="0" placeholder="ex: 155" value={addForm.frequence_cardiaque_moy} onChange={e => setAddForm(f => ({ ...f, frequence_cardiaque_moy: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Note</label>
              <input type="text" placeholder="ex: Sortie cool" value={addForm.note} onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #c5e6d5', fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button
            onClick={handleAddActivity}
            disabled={addLoading || addSuccess || (!addForm.distance_km && !addForm.duree_minutes)}
            style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: addLoading || addSuccess ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s',
              background: addSuccess ? '#f0fdf4' : '#02A257', color: addSuccess ? '#16a34a' : 'white', opacity: (!addForm.distance_km && !addForm.duree_minutes) ? 0.5 : 1 }}>
            {addSuccess ? '✓ Activité enregistrée !' : addLoading ? 'Enregistrement...' : 'Enregistrer l\'activité'}
          </button>
        </div>
        </div>
      )}
    </div>
  )
}

// ── Confidence score ──────────────────────────────────────────

function parseMin(str) {
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

const DIST_KM = { '5K': 5, '10K': 10, 'Semi': 21.1, 'Marathon': 42.195 }

function riegelPredict(refMin, refKm, targetKm) {
  return refMin * Math.pow(targetKm / refKm, 1.06)
}

function formatMinStr(min) {
  const h = Math.floor(min / 60)
  const m = Math.floor(min % 60)
  const s = Math.round((min % 1) * 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}${s > 0 ? ':' + String(s).padStart(2, '0') : ''}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function computePlanConfidence(plan) {
  let score = 70
  const signals = []

  const weeksUntilRace = plan.race_date
    ? Math.floor((new Date(plan.race_date) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : null
  const MIN_WEEKS = { '5K': 4, '10K': 6, 'Semi': 8, 'Marathon': 12 }
  const minWeeks = MIN_WEEKS[plan.distance] || 6

  if (weeksUntilRace !== null) {
    const ratio = weeksUntilRace / minWeeks
    if (ratio >= 2)       { score += 15; signals.push({ type: 'positive', text: `${weeksUntilRace} semaines — délai idéal` }) }
    else if (ratio >= 1.3){ score += 5;  signals.push({ type: 'positive', text: `${weeksUntilRace} semaines, bonne marge` }) }
    else if (ratio >= 1)  { signals.push({ type: 'warning', text: `${weeksUntilRace} semaines, délai juste` }) }
    else                  { score -= 25; signals.push({ type: 'negative', text: `Seulement ${weeksUntilRace} sem. — min. recommandé : ${minWeeks}` }) }
  }

  const volMatrix = {
    '5K':      { '<30km': 5,   '30-60km': 10,  '>60km': 10  },
    '10K':     { '<30km': -5,  '30-60km': 5,   '>60km': 10  },
    'Semi':    { '<30km': -20, '30-60km': 0,   '>60km': 10  },
    'Marathon':{ '<30km': -30, '30-60km': -10, '>60km': 15  },
  }
  const vs = volMatrix[plan.distance]?.[plan.km_per_week]
  if (vs !== undefined) {
    score += vs
    if (vs <= -20) signals.push({ type: 'negative', text: `Volume insuffisant pour un ${plan.distance}` })
    else if (vs < 0) signals.push({ type: 'warning', text: `Volume un peu faible pour un ${plan.distance}` })
    else if (vs >= 10) signals.push({ type: 'positive', text: 'Volume bien adapté à l\'objectif' })
  }

  if (plan.target_time && plan.goal !== 'finish') {
    const targetMin = parseMin(plan.target_time)
    const targetKm  = DIST_KM[plan.distance]
    if (targetMin && targetKm) {
      let best = null
      const refs = plan.ref_times || {}
      for (const [dist, val] of Object.entries(refs)) {
        const refMin = parseMin(val.time)
        const refKm  = DIST_KM[dist] || parseFloat(dist)
        if (!refMin || !refKm) continue
        if (refKm === targetKm) { best = refMin; break }
        const pred = riegelPredict(refMin, refKm, targetKm)
        if (best === null || pred < best) best = pred
      }
      if (best) {
        const ratio = targetMin / best
        const predStr = formatMinStr(best)
        if (ratio < 0.88)      { score -= 30; signals.push({ type: 'negative', text: `Objectif très ambitieux — niveau prédit ~${predStr}` }) }
        else if (ratio < 0.95) { score -= 12; signals.push({ type: 'warning',  text: `Objectif ambitieux — niveau suggère ~${predStr}` }) }
        else if (ratio <= 1.05){ score += 8;  signals.push({ type: 'positive', text: `Objectif cohérent avec tes chronos (~${predStr})` }) }
        else                   { score += 12; signals.push({ type: 'positive', text: `Objectif conservateur, tu as de la marge (~${predStr})` }) }
      }
    }
  }

  score = Math.max(5, Math.min(100, score))
  if (score >= 75) return { score, label: 'Réaliste',       tier: 'green'  }
  if (score >= 55) return { score, label: 'Ambitieux',      tier: 'blue'   }
  if (score >= 35) return { score, label: 'Très ambitieux', tier: 'amber'  }
  return              { score, label: 'Risqué',          tier: 'red'    }
}

const CONF_TIERS = {
  green: { bar: '#02A257', text: '#02A257', bg: '#f0faf5', border: '#c5e6d5' },
  blue:  { bar: '#3b82f6', text: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  amber: { bar: '#f59e0b', text: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  red:   { bar: '#ef4444', text: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const formatTargetTime = (str) => {
  if (!str) return str
  str = str.trim().toLowerCase().replace(/\s/g, '')
  let totalMin = null
  let m
  m = str.match(/^(\d+)h(\d+):(\d+)$/)
  if (m) totalMin = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 60
  if (!m) { m = str.match(/^(\d+)h(\d+)$/); if (m) totalMin = parseInt(m[1]) * 60 + parseInt(m[2]) }
  if (!m) { m = str.match(/^(\d+):(\d+):(\d+)$/); if (m) totalMin = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / 60 }
  if (!m) { m = str.match(/^(\d+):(\d+)$/); if (m) totalMin = parseInt(m[1]) + parseInt(m[2]) / 60 }
  if (totalMin === null) return str
  const totalSec = Math.round(totalMin * 60)
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const formatAllure = (allure) => {
  if (!allure) return '—'
  const min = Math.floor(allure)
  const sec = Math.round((allure - min) * 60)
  return `${min}'${sec.toString().padStart(2, '0')}"`
}

export default function DashboardClient({ courses, plan, stravaConnected }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'plan' ? 'plan' : 'dashboard')
  const [profilOpen, setProfilOpen] = useState(false)
  const [periode, setPeriode] = useState('tout')
  const [distanceMin, setDistanceMin] = useState('')
  const [distanceMax, setDistanceMax] = useState('')
  const [dureeMin, setDureeMin] = useState('')
  const [dureeMax, setDureeMax] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmAbandon, setConfirmAbandon] = useState(null)
  const [abandonLoading, setAbandonLoading] = useState(false)

  const now = new Date()
  const filtered = courses.filter(c => {
    const date = new Date(c.date)
    if (periode === 'semaine') {
      const debut = new Date(now); debut.setDate(now.getDate() - 7)
      if (date < debut) return false
    }
    if (periode === 'mois') {
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return false
    }
    if (periode === 'annee') {
      if (date.getFullYear() !== now.getFullYear()) return false
    }
    if (distanceMin && c.distance_km < parseFloat(distanceMin)) return false
    if (distanceMax && c.distance_km > parseFloat(distanceMax)) return false
    if (dureeMin && c.duree_minutes < parseInt(dureeMin)) return false
    if (dureeMax && c.duree_minutes > parseInt(dureeMax)) return false
    return true
  })

  const totalKm = filtered.reduce((sum, c) => sum + (c.distance_km || 0), 0).toFixed(1)
  const allureMoy = filtered.filter(c => c.allure_moyenne).reduce((sum, c, _, arr) => sum + c.allure_moyenne / arr.length, 0)
  const fcMoy = filtered.filter(c => c.frequence_cardiaque_moy).reduce((sum, c, _, arr) => sum + c.frequence_cardiaque_moy / arr.length, 0)
  const totalDenivele = filtered.reduce((sum, c) => sum + (c.denivele_positif || 0), 0).toFixed(0)

  const handleDelete = async (id) => {
    await fetch(`/api/courses/${id}`, { method: 'DELETE' })
    setConfirmDelete(null)
    router.refresh()
  }

  const handleAbandon = async (planId) => {
    setAbandonLoading(true)
    await fetch('/api/plan/abandon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: planId }),
    })
    setAbandonLoading(false)
    setConfirmAbandon(null)
    router.refresh()
  }

  const periodeBtn = (active) => ({
    padding: '0.4rem 0.75rem', borderRadius: '8px', border: `1px solid ${active ? '#02A257' : '#c5e6d5'}`,
    cursor: 'pointer', fontSize: '0.82rem', background: active ? '#02A257' : 'white',
    color: active ? 'white' : '#656779', fontWeight: active ? '600' : '400',
  })

  const inputStyle = {
    padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #c5e6d5',
    fontSize: '0.82rem', width: '76px', background: 'white', color: '#282830', outline: 'none',
  }

  const tabStyle = (key) => ({
    padding: '0.5rem 1.1rem', borderRadius: '9px', border: 'none', cursor: 'pointer',
    fontSize: '0.88rem', fontWeight: activeTab === key ? '600' : '400',
    background: activeTab === key ? '#f0faf5' : 'transparent',
    color: activeTab === key ? '#02A257' : '#9ea0ae',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf5', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Sticky header ────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #c5e6d5', zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0' }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0 }}>
              <span style={{ color: '#02A257', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-0.01em' }}>VITE</span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.1rem', flex: 1 }}>
              <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
              <button style={{ ...tabStyle('plan'), display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveTab('plan')}>
                Plan
                <span style={{ fontSize: '0.6rem', fontWeight: '700', background: '#02A257', color: 'white', borderRadius: '6px', padding: '0.1rem 0.4rem', letterSpacing: '0.04em' }}>BETA</span>
              </button>
            </div>

            {/* Profile */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setProfilOpen(o => !o)}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: `2px solid ${stravaConnected ? '#02A257' : '#c5e6d5'}`, background: '#f0faf5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </button>

              {profilOpen && (
                <>
                  <div onClick={() => setProfilOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                  <div style={{ position: 'absolute', top: '42px', right: 0, zIndex: 20, ...T.card, padding: '1rem 1.1rem', minWidth: '230px', boxShadow: '0 8px 24px rgba(40,40,48,0.1)' }}>
                    <div style={{ ...T.label, marginBottom: '0.75rem' }}>Tracker connecté</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FC4C02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: '600', ...T.primary }}>Strava</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: '500', color: stravaConnected ? '#16a34a' : '#9ea0ae' }}>
                          {stravaConnected ? '● Synchronisé' : '○ Non connecté'}
                        </div>
                      </div>
                      {stravaConnected ? (
                        <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.2rem 0.55rem', fontWeight: '600' }}>Actif</span>
                      ) : (
                        <a href="/api/auth/strava" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white', textDecoration: 'none', background: '#FC4C02', padding: '0.3rem 0.65rem', borderRadius: '8px' }}>
                          Connecter
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Page content ────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.25rem 3rem' }}>

        {/* ── Tab: Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div style={{ position: 'relative', minHeight: '400px' }}>

            {/* Overlay "En cours de spec" */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', borderRadius: '16px' }}>
              <div style={{ background: 'white', border: '1px solid #c5e6d5', borderRadius: '16px', padding: '1.5rem 2.5rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(40,40,48,0.1)' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🛠️</div>
                <div style={{ fontWeight: '700', color: '#282830', fontSize: '1rem', marginBottom: '0.3rem' }}>En cours de spec</div>
                <div style={{ fontSize: '0.82rem', color: '#9ea0ae' }}>Cette section arrive bientôt.</div>
              </div>
            </div>

            {/* Grayed content */}
            <div style={{ opacity: 0.25, pointerEvents: 'none', userSelect: 'none' }}>
              {/* Filters */}
              <div style={{ ...T.card, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[['tout', 'Tout'], ['semaine', 'Semaine'], ['mois', 'Mois'], ['annee', 'Année']].map(([val, label]) => (
                    <button key={val} style={periodeBtn(val === 'tout')}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {['Kilomètres', 'Courses', 'Allure moy.', 'FC moyenne', 'Dénivelé'].map((label) => (
                  <div key={label} style={{ ...T.card, padding: '1rem 1.1rem', borderLeft: '3px solid #02A257' }}>
                    <div style={{ ...T.label, marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ fontSize: '1.45rem', fontWeight: '700', color: '#282830' }}>—</div>
                  </div>
                ))}
              </div>

              {/* Graphique placeholder */}
              <div style={{ ...T.card, padding: '1.25rem', marginBottom: '1.25rem', height: '180px' }} />

              {/* Courses placeholder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ ...T.card, padding: '1rem 1.25rem', height: '58px' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Plan ── */}
        {activeTab === 'plan' && (
          plan ? <PlanSection plan={plan} onAbandon={setConfirmAbandon} /> : (
            <div style={{ ...T.card, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: '600', ...T.primary, marginBottom: '0.25rem' }}>Aucun plan actif</div>
                <div style={{ fontSize: '0.85rem', ...T.muted }}>Crée ton plan d'entraînement personnalisé pour commencer.</div>
              </div>
              <Link href="/onboarding" style={{ background: '#02A257', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                Créer mon plan →
              </Link>
            </div>
          )
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,40,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '360px', width: '90%', textAlign: 'center', border: '1px solid #c5e6d5' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗑</div>
            <h3 style={{ marginBottom: '0.4rem', ...T.primary }}>Supprimer cette course ?</h3>
            <p style={{ ...T.muted, marginBottom: '1.5rem', fontSize: '0.88rem' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid #c5e6d5', cursor: 'pointer', background: 'white', fontWeight: '500', ...T.muted }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white', fontWeight: '600' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Abandon plan confirm modal ── */}
      {confirmAbandon && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(40,40,48,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center', border: '1px solid #fecaca' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <XCircle size={22} color="#dc2626" />
            </div>
            <h3 style={{ marginBottom: '0.4rem', ...T.primary, fontSize: '1rem' }}>Abandonner ce plan ?</h3>
            <p style={{ ...T.muted, marginBottom: '0.5rem', fontSize: '0.88rem', lineHeight: '1.5' }}>
              Le plan sera archivé et tu pourras en créer un nouveau à tout moment.
            </p>
            <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '1.5rem', fontWeight: '500' }}>
              Ta progression et tes séances validées ne seront pas perdues.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmAbandon(null)}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: '1px solid #c5e6d5', cursor: 'pointer', background: 'white', fontWeight: '500', ...T.muted, fontSize: '0.88rem' }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleAbandon(confirmAbandon)}
                disabled={abandonLoading}
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: '10px', border: 'none', cursor: 'pointer', background: '#dc2626', color: 'white', fontWeight: '600', fontSize: '0.88rem', opacity: abandonLoading ? 0.6 : 1 }}
              >
                {abandonLoading ? 'En cours…' : 'Abandonner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

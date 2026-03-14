'use client'
import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { Settings, RefreshCw, XCircle } from 'lucide-react'

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
  const [menuOpen, setMenuOpen] = useState(false)
  const [confOpen, setConfOpen] = useState(false)

  const semaines = plan.semaines || []
  const today = new Date()
  const raceDate = plan.race_date ? new Date(plan.race_date) : null
  const weeksLeft = raceDate ? Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7)) : null
  const totalSessions = semaines.reduce((sum, w) => sum + (w.seances?.length || 0), 0)
  const completedSessions = semaines.reduce((sum, w) => sum + (w.seances?.filter(s => s.completed || getActivity(s).activity !== null).length || 0), 0)
  const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
  const confidence = computePlanConfidence(plan)
  const confStyle = CONF_TIERS[confidence.tier]

  // Jauge circulaire
  const r = 34
  const circ = 2 * Math.PI * r
  const dash = circ * (confidence.score / 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Plan recap card */}
      <div style={{ ...T.card, overflow: 'hidden' }}>

        {/* Zone 1 — En-tête */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: '700', ...T.primary }}>
              {plan.distance}{plan.race_name ? ` — ${plan.race_name}` : ''}
            </div>
            {raceDate && (
              <div style={{ fontSize: '0.78rem', ...T.muted, marginTop: '0.2rem' }}>
                📅 {raceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {weeksLeft !== null && weeksLeft > 0 && <span style={{ marginLeft: '0.4rem', ...T.green, fontWeight: '600' }}>· J-{weeksLeft * 7}</span>}
              </div>
            )}
          </div>
          {/* Gear */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: menuOpen ? 1 : 0.4 }}
            >
              <Settings size={15} color="#656779" />
            </button>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 20, background: 'white', border: '1px solid #c5e6d5', borderRadius: '12px', boxShadow: '0 6px 20px rgba(40,40,48,0.1)', minWidth: '190px', overflow: 'hidden' }}>
                  <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '500', color: '#282830', borderBottom: '1px solid #f0f0f0' }}>
                    <Settings size={14} color="#9ea0ae" /> Modifier le plan
                  </Link>
                  <Link href="/onboarding" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.84rem', fontWeight: '500', color: '#282830', borderBottom: '1px solid #f0f0f0' }}>
                    <RefreshCw size={14} color="#9ea0ae" /> Nouveau plan
                  </Link>
                  <button onClick={() => { setMenuOpen(false); onAbandon(plan.id) }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', width: '100%', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.84rem', fontWeight: '500', color: '#dc2626', textAlign: 'left' }}>
                    <XCircle size={14} color="#dc2626" /> Abandonner le plan
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zone 2 — Objectif | Confiance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ padding: '1rem 1.25rem', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
            <div style={{ ...T.label, marginBottom: '0.35rem' }}>Objectif</div>
            <div style={{ fontSize: plan.target_time ? '1.6rem' : '1rem', fontWeight: '900', ...T.green, letterSpacing: '-0.02em' }}>
              {plan.target_time ? formatTargetTime(plan.target_time) : '—'}
            </div>
          </div>
          <button
            onClick={() => setConfOpen(true)}
            style={{ padding: '1rem 1.25rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}
          >
            <div style={{ ...T.label, marginBottom: '0.35rem' }}>Confiance</div>
            <svg width="56" height="56" style={{ display: 'block' }}>
              <circle cx="28" cy="28" r="22" stroke="#f0f0f0" strokeWidth="5" fill="none" />
              <circle cx="28" cy="28" r="22"
                stroke={confStyle.bar} strokeWidth="5" fill="none"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - confidence.score / 100)}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <text x="28" y="28" textAnchor="middle" dominantBaseline="middle" fontWeight="800" fontSize="12" fill={confStyle.text}>{confidence.score}</text>
            </svg>
            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: confStyle.text, marginTop: '0.25rem' }}>{confidence.label}</div>
            <div style={{ fontSize: '0.62rem', color: '#b0b3c1', marginTop: '0.2rem' }}>En savoir plus →</div>
          </button>
        </div>

        {/* Zone 3 — Progression + CTA */}
        <div style={{ padding: '0.9rem 1.25rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', ...T.muted }}>{completedSessions}/{totalSessions} séances · {progress}%</span>
            <span style={{ fontSize: '0.72rem', ...T.faint }}>{progress}%</span>
          </div>
          <div style={{ height: '5px', background: '#daf0e8', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#02A257', borderRadius: '99px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
        <Link
          href={`/dashboard/plan/${plan.id}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', padding: '0.75rem', borderTop: '1px solid #f0f0f0', marginTop: '0.9rem', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600', color: '#02A257' }}
        >
          Afficher les séances →
        </Link>

      </div>

      {/* Nouveau plan */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/onboarding"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.9rem', borderRadius: '99px', border: '1px solid #c5e6d5', background: 'white', textDecoration: 'none', fontSize: '0.78rem', fontWeight: '500', color: '#9ea0ae', transition: 'all 0.15s' }}
        >
          + Nouveau plan
        </Link>
      </div>

      {/* Modale confiance */}
      {confOpen && (
        <div onClick={() => setConfOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1.25rem' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 8px 40px rgba(28,28,36,0.2)' }}>
            {/* Titre */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: '700', fontSize: '1rem', color: '#282830' }}>Indice de confiance</div>
              <button onClick={() => setConfOpen(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#9ea0ae' }}>×</button>
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
              <svg width="64" height="64" style={{ flexShrink: 0 }}>
                <circle cx="32" cy="32" r="26" stroke="#f0f0f0" strokeWidth="6" fill="none" />
                <circle cx="32" cy="32" r="26"
                  stroke={confStyle.bar} strokeWidth="6" fill="none"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - confidence.score / 100)}
                  strokeLinecap="round"
                  transform="rotate(-90 32 32)"
                />
                <text x="32" y="32" textAnchor="middle" dominantBaseline="middle" fontWeight="900" fontSize="15" fill={confStyle.text}>{confidence.score}</text>
              </svg>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: confStyle.text }}>{confidence.label}</div>
                <div style={{ fontSize: '0.82rem', color: '#656779', marginTop: '0.2rem' }}>Score de réussite estimé</div>
              </div>
            </div>

            {/* Explication */}
            <div style={{ fontSize: '0.84rem', color: '#464754', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              L'indice de confiance évalue la faisabilité de ton objectif en croisant <strong>le délai avant la course</strong>, <strong>ton volume d'entraînement hebdomadaire</strong> et <strong>tes chronos de référence</strong>.
            </div>

            {/* Signaux */}
            {confidence.signals?.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.1rem' }}>Facteurs détectés</div>
                {confidence.signals.map((s, i) => {
                  const icon = s.type === 'positive' ? '✓' : s.type === 'negative' ? '✗' : '!'
                  const color = s.type === 'positive' ? '#02A257' : s.type === 'negative' ? '#dc2626' : '#d97706'
                  const bg = s.type === 'positive' ? '#f0faf5' : s.type === 'negative' ? '#fef2f2' : '#fffbeb'
                  const border = s.type === 'positive' ? '#c5e6d5' : s.type === 'negative' ? '#fecaca' : '#fde68a'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.55rem 0.75rem', borderRadius: '10px', background: bg, border: `1px solid ${border}` }}>
                      <span style={{ fontWeight: '700', fontSize: '0.75rem', color, flexShrink: 0, marginTop: '0.05rem' }}>{icon}</span>
                      <span style={{ fontSize: '0.82rem', color: '#464754' }}>{s.text}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <button onClick={() => setConfOpen(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', color: '#464754' }}>
              Fermer
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
  if (score >= 75) return { score, label: 'Réaliste',       tier: 'green', signals }
  if (score >= 55) return { score, label: 'Ambitieux',      tier: 'blue',  signals }
  if (score >= 35) return { score, label: 'Très ambitieux', tier: 'amber', signals }
  return              { score, label: 'Risqué',          tier: 'red',   signals }
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
  const [profilEdit, setProfilEdit] = useState(false)
  const [profilData, setProfilData] = useState({ prenom: '', nom: '', dob: '', ville: '', sports: [] })
  const SPORTS = ['Course à pied', 'Trail', 'Vélo', 'Natation', 'Triathlon', 'Marche / Rando', 'Renforcement']
  const toggleSport = (s) => setProfilData(p => ({ ...p, sports: p.sports.includes(s) ? p.sports.filter(x => x !== s) : [...p.sports, s] }))
  const [rps, setRps] = useState([])
  const [rpForm, setRpForm] = useState({ distance: '10K', date: '', chrono: '' })
  const [rpAddOpen, setRpAddOpen] = useState(false)
  const RP_DISTANCES = ['5K', '10K', '15K', 'Semi-marathon', 'Marathon', '50K', '100K', 'Autre']
  const addRp = () => {
    if (!rpForm.chrono) return
    setRps(prev => {
      const filtered = prev.filter(r => r.distance !== rpForm.distance)
      return [...filtered, { ...rpForm }].sort((a, b) => RP_DISTANCES.indexOf(a.distance) - RP_DISTANCES.indexOf(b.distance))
    })
    setRpAddOpen(false)
    setRpForm({ distance: '10K', date: '', chrono: '' })
  }
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
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />

      {/* ── Sticky header ────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '1px solid #c5e6d5', zIndex: 10 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0' }}>

            {/* Logo */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexShrink: 0, textDecoration: 'none' }}>
              <span style={{ color: '#02A257', fontWeight: '900', fontSize: '1.5rem', letterSpacing: '-0.01em' }}>VITE</span>
            </Link>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.1rem', flex: 1 }}>
              <button style={tabStyle('dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
              <button style={{ ...tabStyle('plan'), display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setActiveTab('plan')}>
                Plan
                <span style={{ fontSize: '0.6rem', fontWeight: '700', background: '#02A257', color: 'white', borderRadius: '6px', padding: '0.1rem 0.4rem', letterSpacing: '0.04em' }}>BETA</span>
              </button>
            </div>

            {/* Profile */}
            <div style={{ flexShrink: 0 }}>
              <button
                onClick={() => setProfilOpen(true)}
                style={{ width: '34px', height: '34px', borderRadius: '50%', border: `2px solid ${stravaConnected ? '#02A257' : '#c5e6d5'}`, background: '#f0faf5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </button>
            </div>

            {/* Profil modal */}
            {profilOpen && (() => {
              return (
                <div onClick={() => setProfilOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1rem' }}>
                  <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '380px', boxShadow: '0 8px 40px rgba(28,28,36,0.2)', overflow: 'hidden' }}>

                    {/* Header */}
                    <div style={{ background: '#f0faf5', padding: '1.75rem 1.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #e8f5ee' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#02A257', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4"/>
                          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '1rem', color: '#282830' }}>Mon profil</div>
                      </div>
                      <button onClick={() => setProfilOpen(false)} style={{ border: 'none', background: 'white', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <XCircle size={18} color="#c0c2cc" />
                      </button>
                    </div>

                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '70vh', overflowY: 'auto' }}>

                      {/* Profil */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Profil</div>
                          <button
                            onClick={() => setProfilEdit(e => !e)}
                            style={{ fontSize: '0.7rem', fontWeight: '600', color: profilEdit ? '#02A257' : '#9ea0ae', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {profilEdit ? 'Sauvegarder' : 'Modifier'}
                          </button>
                        </div>

                        {profilEdit ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              {[['prenom', 'Prénom', 'ex: Thomas'], ['nom', 'Nom', 'ex: Martin']].map(([key, label, ph]) => (
                                <div key={key}>
                                  <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>{label}</div>
                                  <input
                                    type="text" placeholder={ph} value={profilData[key]}
                                    onChange={e => setProfilData(p => ({ ...p, [key]: e.target.value }))}
                                    style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Date de naissance</div>
                                <input
                                  type="date" value={profilData.dob}
                                  onChange={e => setProfilData(p => ({ ...p, dob: e.target.value }))}
                                  style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}
                                />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Ville</div>
                                <input
                                  type="text" placeholder="ex: Paris" value={profilData.ville}
                                  onChange={e => setProfilData(p => ({ ...p, ville: e.target.value }))}
                                  style={{ width: '100%', padding: '0.5rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}
                                />
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Sports pratiqués</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {SPORTS.map(s => (
                                  <button
                                    key={s}
                                    onClick={() => toggleSport(s)}
                                    style={{ padding: '0.3rem 0.65rem', borderRadius: '99px', fontSize: '0.73rem', fontWeight: '600', cursor: 'pointer', border: '1.5px solid', transition: 'all 0.12s',
                                      background: profilData.sports.includes(s) ? '#02A257' : 'white',
                                      color: profilData.sports.includes(s) ? 'white' : '#9ea0ae',
                                      borderColor: profilData.sports.includes(s) ? '#02A257' : '#e8e8e8',
                                    }}
                                  >{s}</button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ borderRadius: '14px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            {[
                              { label: 'Prénom', value: profilData.prenom },
                              { label: 'Nom', value: profilData.nom },
                              { label: 'Date de naissance', value: profilData.dob ? new Date(profilData.dob).toLocaleDateString('fr-FR') : null },
                              { label: 'Ville', value: profilData.ville },
                              { label: 'Sports', value: profilData.sports.length > 0 ? profilData.sports.join(', ') : null },
                            ].map(({ label, value }, i, arr) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: i % 2 === 0 ? '#fafafa' : 'white', borderBottom: i < arr.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                <span style={{ fontSize: '0.78rem', color: '#9ea0ae', fontWeight: '500' }}>{label}</span>
                                <span style={{ fontSize: '0.82rem', color: value ? '#282830' : '#d0d2dc', fontWeight: value ? '600' : '400', maxWidth: '180px', textAlign: 'right' }}>{value || '—'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mes RPs */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mes RPs</div>
                          <button onClick={() => setRpAddOpen(o => !o)} style={{ fontSize: '0.7rem', fontWeight: '600', color: '#02A257', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            + Ajouter
                          </button>
                        </div>

                        {rpAddOpen && (
                          <div style={{ background: '#f7f7f8', borderRadius: '12px', padding: '0.85rem', marginBottom: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Distance</div>
                              <select value={rpForm.distance} onChange={e => setRpForm(f => ({ ...f, distance: e.target.value }))}
                                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}>
                                {RP_DISTANCES.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                              <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Chrono</div>
                                <input type="text" placeholder="ex: 0:45:30" value={rpForm.chrono} onChange={e => setRpForm(f => ({ ...f, chrono: e.target.value }))}
                                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Date</div>
                                <input type="date" value={rpForm.date} max={new Date().toISOString().split('T')[0]} onChange={e => setRpForm(f => ({ ...f, date: e.target.value }))}
                                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.1rem' }}>
                              <button onClick={() => setRpAddOpen(false)} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', color: '#656779' }}>Annuler</button>
                              <button onClick={addRp} disabled={!rpForm.chrono} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: 'none', background: rpForm.chrono ? '#02A257' : '#e0e0e0', cursor: rpForm.chrono ? 'pointer' : 'default', fontSize: '0.78rem', fontWeight: '600', color: 'white' }}>Enregistrer</button>
                            </div>
                          </div>
                        )}

                        {rps.length === 0 && !rpAddOpen ? (
                          <div style={{ padding: '1rem', borderRadius: '12px', border: '1px dashed #e0e0e0', textAlign: 'center', fontSize: '0.78rem', color: '#c0c2cc' }}>
                            Aucun RP enregistré pour le moment.
                          </div>
                        ) : (
                          <div style={{ borderRadius: '14px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                            {rps.map(({ distance, chrono, date }, i) => (
                              <div key={distance} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: i % 2 === 0 ? '#fafafa' : 'white', borderBottom: i < rps.length - 1 ? '1px solid #f5f5f5' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#282830' }}>{distance}</span>
                                  {date && <span style={{ fontSize: '0.68rem', color: '#b0b3c1' }}>{new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>}
                                </div>
                                <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#02A257' }}>{chrono}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Tracker */}
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Tracker connecté</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #f0f0f0', background: '#fafafa' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FC4C02', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#282830' }}>Strava</div>
                            <div style={{ fontSize: '0.72rem', fontWeight: '500', color: stravaConnected ? '#16a34a' : '#9ea0ae' }}>
                              {stravaConnected ? '● Synchronisé' : '○ Non connecté'}
                            </div>
                          </div>
                          {stravaConnected ? (
                            <span style={{ fontSize: '0.7rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.2rem 0.55rem', fontWeight: '600' }}>Actif</span>
                          ) : (
                            <a href="/api/auth/strava" style={{ fontSize: '0.75rem', fontWeight: '600', color: 'white', textDecoration: 'none', background: '#FC4C02', padding: '0.35rem 0.7rem', borderRadius: '8px' }}>
                              Connecter
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Compte — bientôt */}
                      <div>
                        <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Compte</div>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '14px', border: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                          <div style={{ fontSize: '0.85rem', color: '#9ea0ae' }}>Email / mot de passe</div>
                          <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#b0b3c1', background: '#f0f0f0', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>Bientôt</span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )
            })()}
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
              <div style={{ background: 'white', border: '1px solid #c5e6d5', borderRadius: '16px', padding: '1.5rem 2rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(40,40,48,0.1)', maxWidth: '320px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'white', border: '1px solid #c5e6d5', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <svg width="30" height="30" viewBox="0 0 52 52" fill="none">
                      <rect x="4" y="14" width="44" height="24" rx="12" stroke="#02A257" strokeWidth="5" fill="none"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontWeight: '700', color: '#282830', fontSize: '1rem', marginBottom: '0.4rem' }}>En train de courir !</div>
                <div style={{ fontSize: '0.82rem', color: '#9ea0ae', lineHeight: 1.55, marginBottom: '1.1rem' }}>L'équipe produit bosse d'arrache pied sur la discovery, si tu as des idées, n'hésite pas ! Penses-y en courant !</div>
                <button
                  onClick={() => window.Tally?.openPopup('5B2X2Z', { layout: 'modal', width: 600, autoClose: 3000 })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: '10px', background: '#02A257', color: 'white', fontSize: '0.8rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                >
                  J'ai plein d'idées →
                </button>
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

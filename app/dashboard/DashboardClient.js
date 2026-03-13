'use client'
import Graphique from './Graphique'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, RefreshCw, XCircle } from 'lucide-react'

const INTENSITE_COLORS = {
  'facile':       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'modéré':       { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'intense':      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'récupération': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

const TYPE_ICONS = {
  'Footing léger':      '🟢',
  'Sortie longue':      '🔵',
  'Fractionné':         '🔴',
  'Allure spécifique':  '🟠',
  'Récupération active':'🟣',
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
  const semaines = plan.semaines || []
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
  const progress = Math.round(((selectedWeek + 1) / totalWeeks) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Plan header card */}
      <div style={{ ...T.card, padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ ...T.label, marginBottom: '0.3rem' }}>Plan actif</div>
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
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', ...T.green }}>
                {selectedWeek + 1}<span style={{ fontSize: '0.8rem', ...T.faint, fontWeight: '400' }}>/{totalWeeks}</span>
              </div>
              <div style={{ ...T.label }}>Semaine</div>
            </div>
            {plan.target_time && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', ...T.primary }}>{plan.target_time}</div>
                <div style={{ ...T.label }}>Objectif</div>
              </div>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: '6px', background: '#daf0e8', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#02A257', borderRadius: '99px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', ...T.faint }}>
          <span>Début</span>
          <span style={{ ...T.green, fontWeight: '600' }}>{progress}% complété</span>
          <span>Course</span>
        </div>
      </div>

      {/* Plan actions */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <Link
          href="/onboarding"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.55rem 1rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600',
            background: 'white', border: '1px solid #c5e6d5', color: '#464754',
          }}
        >
          <Settings size={14} color="#9ea0ae" />
          Modifier le plan
        </Link>
        <Link
          href="/onboarding"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.55rem 1rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600',
            background: '#02A257', color: 'white', border: '1px solid #02A257',
          }}
        >
          <RefreshCw size={14} color="white" />
          Nouveau plan
        </Link>
        <button
          onClick={() => onAbandon(plan.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
            padding: '0.55rem 1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
            background: 'white', border: '1px solid #fecaca', color: '#dc2626',
          }}
        >
          <XCircle size={14} color="#dc2626" />
          Abandonner
        </button>
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

      {/* Week detail */}
      <div style={{ ...T.card, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #daf0e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ ...T.label }}>
              Semaine {semaine.numero}{selectedWeek === currentWeekIndex ? ' · Cette semaine' : ''}
            </div>
            <div style={{ fontWeight: '700', ...T.primary, marginTop: '0.15rem' }}>{semaine.theme}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', ...T.green, fontSize: '1.1rem' }}>{semaine.volume_km} km</div>
            <div style={{ fontSize: '0.75rem', ...T.faint }}>{semaine.seances?.length} séances</div>
          </div>
        </div>
        <div>
          {(semaine.seances || []).map((seance, i) => {
            const colors = INTENSITE_COLORS[seance.intensite] || INTENSITE_COLORS['modéré']
            return (
              <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: i < semaine.seances.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', ...T.green, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{seance.jour?.slice(0, 3)}</div>
                  <div style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>{TYPE_ICONS[seance.type] || '🏃'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', ...T.primary, fontSize: '0.9rem' }}>{seance.type}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                      {seance.intensite}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', ...T.muted, marginBottom: '0.3rem' }}>{seance.description}</div>
                  {seance.details && <div style={{ fontSize: '0.75rem', ...T.faint, fontStyle: 'italic' }}>{seance.details}</div>}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', ...T.primary, fontSize: '0.9rem' }}>{seance.distance_km} km</div>
                  {seance.allure_cible && <div style={{ fontSize: '0.75rem', ...T.green, fontWeight: '600' }}>{seance.allure_cible}</div>}
                  {seance.duree_minutes && <div style={{ fontSize: '0.72rem', ...T.faint }}>{seance.duree_minutes} min</div>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
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
              <Image src="/icon.png" alt="VITE" width={28} height={28} style={{ borderRadius: '8px' }} />
              <span style={{ color: '#02A257', fontWeight: '900', fontSize: '1rem', letterSpacing: '-0.01em' }}>VITE</span>
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

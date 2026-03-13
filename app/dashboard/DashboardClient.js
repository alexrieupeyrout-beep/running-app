'use client'
import Graphique from './Graphique'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Calendar, Target, Zap, TrendingUp } from 'lucide-react'

const INTENSITE_COLORS = {
  'facile': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'modéré': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'intense': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'récupération': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

const TYPE_ICONS = {
  'Footing léger': '🟢',
  'Sortie longue': '🔵',
  'Fractionné': '🔴',
  'Allure spécifique': '🟠',
  'Récupération active': '🟣',
}

function PlanSection({ plan }) {
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
    <div style={{ marginBottom: '2.5rem' }}>
      {/* Header plan */}
      <div style={{ background: 'white', border: '1px solid #dde5cb', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9ea0ae', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.3rem' }}>Plan actif</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#282830' }}>
              {plan.distance}{plan.race_name ? ` — ${plan.race_name}` : ''}
            </div>
            {raceDate && (
              <div style={{ fontSize: '0.8rem', color: '#656779', marginTop: '0.2rem' }}>
                📅 {raceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                {weeksLeft !== null && weeksLeft > 0 && <span style={{ marginLeft: '0.5rem', color: '#6b9a23', fontWeight: '600' }}>· J-{weeksLeft * 7}</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#6b9a23' }}>{selectedWeek + 1}<span style={{ fontSize: '0.8rem', color: '#9ea0ae', fontWeight: '400' }}>/{totalWeeks}</span></div>
              <div style={{ fontSize: '0.7rem', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semaine</div>
            </div>
            {plan.target_time && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#282830' }}>{plan.target_time}</div>
                <div style={{ fontSize: '0.7rem', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Objectif</div>
              </div>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#6b9a23', borderRadius: '99px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.7rem', color: '#c4c7d6' }}>
          <span>Début</span>
          <span>{progress}% complété</span>
          <span>Course</span>
        </div>
      </div>

      {/* Navigation semaine */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
          disabled={selectedWeek === 0}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #dde5cb', background: 'white', cursor: selectedWeek === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === 0 ? 0.3 : 1 }}
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
                background: i === selectedWeek ? '#6b9a23' : i === currentWeekIndex ? '#f5f8ee' : 'white',
                color: i === selectedWeek ? 'white' : i === currentWeekIndex ? '#6b9a23' : '#9ea0ae',
                borderColor: i === selectedWeek ? '#6b9a23' : i === currentWeekIndex ? '#6b9a23' : '#dde5cb',
              }}
            >
              S{i + 1}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSelectedWeek(w => Math.min(totalWeeks - 1, w + 1))}
          disabled={selectedWeek === totalWeeks - 1}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #dde5cb', background: 'white', cursor: selectedWeek === totalWeeks - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === totalWeeks - 1 ? 0.3 : 1 }}
        >
          <ChevronRight size={16} color="#464754" />
        </button>
      </div>

      {/* Semaine detail */}
      <div style={{ background: 'white', border: '1px solid #dde5cb', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #edf3de', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: '#9ea0ae', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Semaine {semaine.numero} {selectedWeek === currentWeekIndex ? '· Cette semaine' : ''}
            </span>
            <div style={{ fontWeight: '700', color: '#282830', marginTop: '0.15rem' }}>{semaine.theme}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: '#6b9a23', fontSize: '1.1rem' }}>{semaine.volume_km} km</div>
            <div style={{ fontSize: '0.75rem', color: '#9ea0ae' }}>{semaine.seances?.length} séances</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {(semaine.seances || []).map((seance, i) => {
            const colors = INTENSITE_COLORS[seance.intensite] || INTENSITE_COLORS['modéré']
            return (
              <div key={i} style={{ padding: '1rem 1.5rem', borderBottom: i < semaine.seances.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#6b9a23', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{seance.jour?.slice(0, 3)}</div>
                  <div style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>{TYPE_ICONS[seance.type] || '🏃'}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '600', color: '#282830', fontSize: '0.9rem' }}>{seance.type}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>
                      {seance.intensite}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#656779', marginBottom: '0.3rem' }}>{seance.description}</div>
                  {seance.details && <div style={{ fontSize: '0.75rem', color: '#9ea0ae', fontStyle: 'italic' }}>{seance.details}</div>}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: '#282830', fontSize: '0.9rem' }}>{seance.distance_km} km</div>
                  {seance.allure_cible && <div style={{ fontSize: '0.75rem', color: '#6b9a23', fontWeight: '600' }}>{seance.allure_cible}</div>}
                  {seance.duree_minutes && <div style={{ fontSize: '0.72rem', color: '#9ea0ae' }}>{seance.duree_minutes} min</div>}
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

export default function DashboardClient({ courses, plan }) {
  const router = useRouter()
  const [periode, setPeriode] = useState('tout')
  const [distanceMin, setDistanceMin] = useState('')
  const [distanceMax, setDistanceMax] = useState('')
  const [dureeMin, setDureeMin] = useState('')
  const [dureeMax, setDureeMax] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

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

  const inputStyle = { padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem', width: '80px' }
  const btnStyle = (active) => ({
    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
    background: active ? '#6366f1' : '#f3f4f6', color: active ? 'white' : '#374151', fontWeight: active ? '600' : '400'
  })

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>PaceIQ</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Dashboard running</p>

      {plan ? <PlanSection plan={plan} /> : (
        <div style={{ background: '#f5f8ee', border: '1px solid #dde5cb', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontWeight: '600', color: '#282830', marginBottom: '0.25rem' }}>Aucun plan actif</div>
            <div style={{ fontSize: '0.85rem', color: '#656779' }}>Crée ton plan d'entraînement personnalisé pour commencer.</div>
          </div>
          <Link href="/onboarding" style={{ background: '#6b9a23', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
            Créer mon plan →
          </Link>
        </div>
      )}

      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem 1.2rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[['tout', 'Tout'], ['semaine', 'Cette semaine'], ['mois', 'Ce mois'], ['annee', 'Cette année']].map(([val, label]) => (
            <button key={val} style={btnStyle(periode === val)} onClick={() => setPeriode(val)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: '#888' }}>Distance</span>
          <input style={inputStyle} placeholder="min km" value={distanceMin} onChange={e => setDistanceMin(e.target.value)} />
          <span style={{ color: '#888' }}>→</span>
          <input style={inputStyle} placeholder="max km" value={distanceMax} onChange={e => setDistanceMax(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: '#888' }}>Durée</span>
          <input style={inputStyle} placeholder="min min" value={dureeMin} onChange={e => setDureeMin(e.target.value)} />
          <span style={{ color: '#888' }}>→</span>
          <input style={inputStyle} placeholder="max min" value={dureeMax} onChange={e => setDureeMax(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Kilomètres', value: `${totalKm} km`, color: '#6366f1' },
          { label: 'Courses', value: filtered.length, color: '#10b981' },
          { label: 'Allure moy.', value: formatAllure(allureMoy), color: '#f59e0b' },
          { label: 'FC moyenne', value: fcMoy ? `${Math.round(fcMoy)} bpm` : '—', color: '#ef4444' },
          { label: 'Dénivelé', value: `${totalDenivele} m`, color: '#8b5cf6' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.2rem', borderLeft: `4px solid ${stat.color}` }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <Graphique courses={filtered} /> <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
        {filtered.length} course{filtered.length > 1 ? 's' : ''}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map((course) => (
          <div key={course.id} style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <Link href={`/dashboard/${course.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{course.note || 'Course'}</div>
              <div style={{ fontSize: '0.85rem', color: '#888' }}>{course.date}</div>
            </Link>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>📍 {course.distance_km} km</span>
              <span>⏱ {course.duree_minutes} min</span>
              {course.allure_moyenne && <span>🏃 {formatAllure(course.allure_moyenne)}/km</span>}
              {course.frequence_cardiaque_moy && <span>❤️ {Math.round(course.frequence_cardiaque_moy)} bpm</span>}
              <button onClick={() => setConfirmDelete(course.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#ef4444' }}>🗑</button>
            </div>
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '380px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗑</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Supprimer cette course ?</h3>
            <p style={{ color: '#888', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Cette action est irréversible.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', background: 'white' }}>Annuler</button>
              <button onClick={() => handleDelete(confirmDelete)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#ef4444', color: 'white', fontWeight: '600' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
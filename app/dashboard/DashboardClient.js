'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const formatAllure = (allure) => {
  if (!allure) return '—'
  const min = Math.floor(allure)
  const sec = Math.round((allure - min) * 60)
  return `${min}'${sec.toString().padStart(2, '0')}"`
}

export default function DashboardClient({ courses }) {
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
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.25rem' }}>🏃 PaceIQ</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Votre dashboard running</p>

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

      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>
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
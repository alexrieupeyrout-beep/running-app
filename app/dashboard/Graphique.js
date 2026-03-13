'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function Graphique({ courses }) {
  const [vue, setVue] = useState('semaine')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const btnStyle = (active) => ({
    padding: '0.4rem 0.8rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
    background: active ? '#6366f1' : '#f3f4f6', color: active ? 'white' : '#374151', fontWeight: active ? '600' : '400'
  })

  const coursesFiltrees = courses.filter(c => {
    if (vue === 'custom' && dateDebut && dateFin) {
      return c.date >= dateDebut && c.date <= dateFin
    }
    return true
  })

  const getData = () => {
    if (vue === 'semaine' || vue === 'custom') {
      const parSemaine = coursesFiltrees.reduce((acc, course) => {
        const date = new Date(course.date)
        const debut = new Date(date)
        debut.setDate(date.getDate() - date.getDay() + 1)
        const semaine = debut.toISOString().split('T')[0]
        if (!acc[semaine]) acc[semaine] = { label: semaine.slice(5), km: 0 }
        acc[semaine].km += course.distance_km || 0
        return acc
      }, {})
      return Object.values(parSemaine).sort((a, b) => a.label.localeCompare(b.label)).map(s => ({ ...s, km: parseFloat(s.km.toFixed(1)) }))
    }

    if (vue === 'mois') {
      const parMois = coursesFiltrees.reduce((acc, course) => {
        const mois = course.date.slice(0, 7)
        if (!acc[mois]) acc[mois] = { label: mois, km: 0 }
        acc[mois].km += course.distance_km || 0
        return acc
      }, {})
      return Object.values(parMois).sort((a, b) => a.label.localeCompare(b.label)).map(s => ({ ...s, km: parseFloat(s.km.toFixed(1)) }))
    }

    if (vue === 'annee') {
      const parAnnee = coursesFiltrees.reduce((acc, course) => {
        const annee = course.date.slice(0, 4)
        if (!acc[annee]) acc[annee] = { label: annee, km: 0 }
        acc[annee].km += course.distance_km || 0
        return acc
      }, {})
      return Object.values(parAnnee).sort((a, b) => a.label.localeCompare(b.label)).map(s => ({ ...s, km: parseFloat(s.km.toFixed(1)) }))
    }
  }

  const data = getData()

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>📈 Progression</h2>
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[['semaine', 'Par semaine'], ['mois', 'Par mois'], ['annee', 'Par année'], ['custom', 'Période']].map(([val, label]) => (
            <button key={val} style={btnStyle(vue === val)} onClick={() => setVue(val)}>{label}</button>
          ))}
          {vue === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
              <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
              <span style={{ color: '#888' }}>→</span>
              <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
                style={{ padding: '0.4rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.85rem' }} />
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis tick={{ fontSize: 12, fill: '#888' }} unit=" km" />
            <Tooltip
              formatter={(value) => [`${value} km`, 'Distance']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="km" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
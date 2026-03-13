'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Graphique({ courses }) {
  const parSemaine = courses.reduce((acc, course) => {
    const date = new Date(course.date)
    const debut = new Date(date)
    debut.setDate(date.getDate() - date.getDay() + 1)
    const semaine = debut.toISOString().split('T')[0]
    if (!acc[semaine]) acc[semaine] = { semaine, km: 0, courses: 0 }
    acc[semaine].km += course.distance_km || 0
    acc[semaine].courses += 1
    return acc
  }, {})

  const data = Object.values(parSemaine)
    .sort((a, b) => new Date(a.semaine) - new Date(b.semaine))
    .map(s => ({ ...s, km: parseFloat(s.km.toFixed(1)), label: s.semaine.slice(5) }))

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>📈 Progression hebdomadaire</h2>
      <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.5rem' }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis tick={{ fontSize: 12, fill: '#888' }} unit=" km" />
            <Tooltip
              formatter={(value) => [`${value} km`, 'Distance']}
              labelFormatter={(label) => `Semaine du ${label}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Bar dataKey="km" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
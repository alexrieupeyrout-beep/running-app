import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const formatAllure = (allure) => {
  if (!allure) return '—'
  const min = Math.floor(allure)
  const sec = Math.round((allure - min) * 60)
  return `${min}'${sec.toString().padStart(2, '0')}"`
}

export default async function CourseDetail({ params }) {
  const { id } = await params
  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (!course) return <div style={{ padding: '2rem' }}>Course introuvable</div>

  const stats = [
    { label: 'Distance', value: `${course.distance_km} km`, emoji: '📍' },
    { label: 'Durée', value: `${course.duree_minutes} min`, emoji: '⏱' },
    { label: 'Allure moyenne', value: formatAllure(course.allure_moyenne), emoji: '🏃' },
    { label: 'FC moyenne', value: course.frequence_cardiaque_moy ? `${Math.round(course.frequence_cardiaque_moy)} bpm` : '—', emoji: '❤️' },
    { label: 'FC max', value: course.frequence_cardiaque_max ? `${Math.round(course.frequence_cardiaque_max)} bpm` : '—', emoji: '💓' },
    { label: 'Dénivelé', value: course.denivele_positif ? `${course.denivele_positif} m` : '—', emoji: '⛰️' },
    { label: 'Calories', value: course.calories ? `${Math.round(course.calories)} kcal` : '—', emoji: '🔥' },
    { label: 'Cadence', value: course.cadence_moyenne ? `${Math.round(course.cadence_moyenne * 2)} spm` : '—', emoji: '👟' },
    { label: 'Vitesse max', value: course.vitesse_max ? `${(course.vitesse_max * 3.6).toFixed(1)} km/h` : '—', emoji: '⚡' },
    { label: 'Température', value: course.temperature ? `${course.temperature}°C` : '—', emoji: '🌡️' },
  ]

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <Link href="/dashboard" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '0.9rem' }}>← Retour au dashboard</Link>
      
      <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '1rem 0 0.25rem' }}>{course.note || 'Course'}</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>{course.date}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: '#f9fafb', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>{stat.emoji}</div>
            <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {course.splits && (
        <>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Splits par km</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {course.splits.map((split, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#f9fafb', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '600' }}>Km {split.split}</span>
                <span>📍 {(split.distance / 1000).toFixed(2)} km</span>
                <span>⏱ {formatAllure(split.average_speed ? 1000 / split.average_speed / 60 : null)}/km</span>
                {split.average_heartrate && <span>❤️ {Math.round(split.average_heartrate)} bpm</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
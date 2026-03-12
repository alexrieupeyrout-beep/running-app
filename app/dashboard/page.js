import { supabase } from '@/lib/supabase'

export default async function Dashboard() {
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('date', { ascending: false })

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🏃 Mon Dashboard Running</h1>
      <p>{courses?.length || 0} courses enregistrées</p>
      <ul>
        {courses?.map((course) => (
          <li key={course.id}>
            {course.date} — {course.distance_km} km en {course.duree_minutes} min
            {course.note && ` — ${course.note}`}
          </li>
        ))}
      </ul>
    </main>
  )
}
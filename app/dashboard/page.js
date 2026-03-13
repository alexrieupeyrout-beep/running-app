import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function Dashboard() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('date', { ascending: false })

  console.log('Courses:', courses)
  console.log('Erreur:', error)

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
}export const revalidate = 0
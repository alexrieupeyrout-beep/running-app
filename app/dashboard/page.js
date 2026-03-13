export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function Dashboard() {
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('date', { ascending: false })

  return <DashboardClient courses={courses || []} />
}
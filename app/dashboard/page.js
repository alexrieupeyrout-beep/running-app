export const revalidate = 0

import { createClient } from '@supabase/supabase-js'
import DashboardClient from './DashboardClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export default async function Dashboard() {
  const [{ data: courses }, { data: plan }, { data: stravaToken }] = await Promise.all([
    supabase.from('courses').select('*').order('date', { ascending: false }),
    supabase.from('plans').select('*').eq('statut', 'actif').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('strava_tokens').select('athlete_id, expires_at').order('athlete_id', { ascending: false }).limit(1).maybeSingle(),
  ])

  return <DashboardClient courses={courses || []} plan={plan || null} stravaConnected={!!stravaToken} />
}
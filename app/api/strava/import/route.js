import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: tokens } = await supabase
    .from('strava_tokens')
    .select('*')
    .single()

  if (!tokens) {
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connect`)
  }

  const response = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  const activities = await response.json()
  const runs = activities.filter(a => a.type === 'Run')

  for (const activity of runs) {
    await supabase.from('courses').upsert({
      strava_id: activity.id,
      date: activity.start_date_local.split('T')[0],
      distance_km: Math.round(activity.distance / 100) / 10,
      duree_minutes: Math.round(activity.moving_time / 60),
      note: activity.name,
    }, { onConflict: 'strava_id' })
  }

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`)
}
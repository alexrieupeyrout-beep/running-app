import { supabase } from '@/lib/supabase'
import { getValidStravaToken } from '@/lib/strava'

export async function GET() {
  const token = await getValidStravaToken()
  console.log('Token:', token)

  const response = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const activities = await response.json()
  console.log('Réponse Strava:', JSON.stringify(activities))

  if (!Array.isArray(activities)) {
    return Response.json({ erreur: activities })
  }

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

  return Response.json({ imported: runs.length })
}
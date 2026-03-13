import { supabase } from '@/lib/supabase'
import { getValidStravaToken } from '@/lib/strava'

export async function GET() {
  const token = await getValidStravaToken()

  const response = await fetch(
    'https://www.strava.com/api/v3/athlete/activities?per_page=50',
    { headers: { Authorization: `Bearer ${token}` } }
  )

  const activities = await response.json()

  if (!Array.isArray(activities)) {
    return Response.json({ erreur: activities })
  }

  const runs = activities.filter(a => a.type === 'Run')
  const errors = []

  for (const activity of runs) {
    const detailResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activity.id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const detail = await detailResponse.json()

    const { error } = await supabase.from('courses').upsert({
      strava_id: activity.id,
      date: activity.start_date_local.split('T')[0],
      distance_km: Math.round(activity.distance / 100) / 10,
      duree_minutes: Math.round(activity.moving_time / 60),
      note: activity.name,
      allure_moyenne: detail.average_speed ? Math.round(1000 / detail.average_speed) / 60 : null,
      frequence_cardiaque_moy: detail.average_heartrate || null,
      frequence_cardiaque_max: detail.max_heartrate || null,
      denivele_positif: detail.total_elevation_gain || null,
      calories: detail.calories || null,
      cadence_moyenne: detail.average_cadence || null,
      vitesse_max: detail.max_speed || null,
      temperature: detail.average_temp || null,
      splits: detail.splits_metric || null,
    }, { onConflict: 'strava_id' })

    if (error) errors.push({ activity: activity.name, error })
  }

  return Response.json({ imported: runs.length, errors })
}
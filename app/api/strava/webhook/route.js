import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return Response.json({ 'hub.challenge': challenge })
  }

  return new Response('Forbidden', { status: 403 })
}

export async function POST(request) {
  const event = await request.json()

  if (event.object_type !== 'activity' || event.aspect_type !== 'create') {
    return Response.json({ received: true })
  }

  const { data: tokens } = await supabase
    .from('strava_tokens')
    .select('*')
    .eq('athlete_id', event.owner_id)
    .maybeSingle()

  if (!tokens) return Response.json({ received: true })

  // Refresh du token avant d'appeler l'API
  const refreshRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const refreshData = await refreshRes.json()
  const accessToken = refreshData.access_token || tokens.access_token

  // Mise à jour du token en base
  if (refreshData.access_token) {
    await supabase.from('strava_tokens').update({
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token,
      expires_at: refreshData.expires_at,
    }).eq('athlete_id', event.owner_id)
  }

  const activityResponse = await fetch(
    `https://www.strava.com/api/v3/activities/${event.object_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  const activity = await activityResponse.json()

  const ACCEPTED_TYPES = ['Run', 'Ride', 'VirtualRide', 'Walk', 'Hike', 'Swim', 'WeightTraining', 'Yoga', 'Workout', 'EBikeRide', 'Rowing']
  if (!activity.id || !ACCEPTED_TYPES.includes(activity.type)) return Response.json({ received: true })

  await supabase.from('courses').upsert({
    strava_id: activity.id,
    date: activity.start_date_local.split('T')[0],
    distance_km: Math.round(activity.distance / 100) / 10,
    duree_minutes: Math.round(activity.moving_time / 60),
    note: activity.name,
    type_activite: activity.type,
    allure_moyenne: activity.average_speed ? Math.round(1000 / activity.average_speed) / 60 : null,
    frequence_cardiaque_moy: activity.average_heartrate || null,
    frequence_cardiaque_max: activity.max_heartrate || null,
    denivele_positif: activity.total_elevation_gain || null,
    calories: activity.calories || null,
  }, { onConflict: 'strava_id' })

  return Response.json({ received: true })
}
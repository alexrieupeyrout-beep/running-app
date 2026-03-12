import { supabase } from '@/lib/supabase'

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

  const tokenData = await supabase
    .from('strava_tokens')
    .select('*')
    .single()

  const { data: tokens } = tokenData

  const activityResponse = await fetch(
    `https://www.strava.com/api/v3/activities/${event.object_id}`,
    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
  )

  const activity = await activityResponse.json()

  await supabase.from('courses').insert({
    date: activity.start_date_local.split('T')[0],
    distance_km: Math.round(activity.distance / 100) / 10,
    duree_minutes: Math.round(activity.moving_time / 60),
    note: activity.name,
    strava_id: activity.id,
  })

  return Response.json({ received: true })
}
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  })

  const data = await response.json()

  if (!data.athlete) {
    return new Response(`Erreur Strava: ${JSON.stringify(data)}`, { status: 500 })
  }

  const athleteId = data.athlete.id
  const tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  }

  const { data: existing } = await supabase
    .from('strava_tokens')
    .select('athlete_id')
    .eq('athlete_id', athleteId)
    .single()

  const { error } = existing
    ? await supabase.from('strava_tokens').update(tokenData).eq('athlete_id', athleteId)
    : await supabase.from('strava_tokens').insert({ athlete_id: athleteId, ...tokenData })

  if (error) {
    return new Response(`Erreur Supabase: ${JSON.stringify(error)}`, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  return Response.redirect(`${appUrl}/api/strava/import`)
}
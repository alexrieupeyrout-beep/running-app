import { supabase } from '@/lib/supabase'

export async function getValidStravaToken() {
  const { data: tokens } = await supabase
    .from('strava_tokens')
    .select('*')
    .single()

  if (!tokens) throw new Error('Pas de token Strava dans Supabase')

  const response = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  return data.access_token
}
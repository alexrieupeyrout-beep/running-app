import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function getValidStravaToken() {
  const { data: tokens, error } = await supabase
    .from('strava_tokens')
    .select('*')
    .single()

  console.log('Tokens:', JSON.stringify(tokens))
  console.log('Erreur:', JSON.stringify(error))

  if (!tokens) throw new Error(`Pas de token: ${JSON.stringify(error)}`)

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
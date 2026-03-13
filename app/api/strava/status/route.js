import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function GET() {
  const { data } = await supabase
    .from('strava_tokens')
    .select('athlete_id, expires_at')
    .order('athlete_id', { ascending: false })
    .limit(1)
    .maybeSingle()

  return Response.json({ connected: !!data, athlete_id: data?.athlete_id || null })
}

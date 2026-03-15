import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

async function getAthleteId() {
  const { data } = await supabase
    .from('strava_tokens')
    .select('athlete_id')
    .order('athlete_id', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.athlete_id || null
}

export async function GET() {
  try {
    const athlete_id = await getAthleteId()
    if (!athlete_id) return Response.json({ error: 'Non connecté' }, { status: 401 })

    const { data } = await supabase
      .from('strava_tokens')
      .select('advanced_profile')
      .eq('athlete_id', athlete_id)
      .single()

    return Response.json({ advanced_profile: data?.advanced_profile || {} })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const athlete_id = await getAthleteId()
    if (!athlete_id) return Response.json({ error: 'Non connecté' }, { status: 401 })

    const body = await request.json()

    const { error } = await supabase
      .from('strava_tokens')
      .update({ advanced_profile: body })
      .eq('athlete_id', athlete_id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

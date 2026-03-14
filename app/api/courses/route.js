import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()

    const { data: tokenRow } = await supabase
      .from('strava_tokens')
      .select('athlete_id')
      .order('athlete_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!tokenRow) return Response.json({ error: 'Non authentifié' }, { status: 401 })

    const { error } = await supabase.from('courses').insert({
      date: body.date,
      type_activite: body.type_activite || 'Manual',
      distance_km: body.distance_km ? parseFloat(body.distance_km) : null,
      duree_minutes: body.duree_minutes ? parseInt(body.duree_minutes) : null,
      frequence_cardiaque_moy: body.frequence_cardiaque_moy ? parseInt(body.frequence_cardiaque_moy) : null,
      note: body.note || null,
    })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

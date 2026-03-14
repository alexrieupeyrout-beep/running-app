import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function POST(request) {
  try {
    const { plan_id, action } = await request.json()
    if (!plan_id) return Response.json({ error: 'plan_id requis' }, { status: 400 })

    const statut = action === 'reprendre' ? 'actif' : 'en_pause'

    const { error } = await supabase
      .from('plans')
      .update({ statut })
      .eq('id', plan_id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

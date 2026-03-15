import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function PATCH(request) {
  try {
    const { plan_id, week_index, session_index, completed, manual_activity, note, fatigue } = await request.json()
    if (!plan_id) return Response.json({ error: 'plan_id requis' }, { status: 400 })

    const { data: plan, error: fetchError } = await supabase
      .from('plans')
      .select('semaines')
      .eq('id', plan_id)
      .single()

    if (fetchError || !plan) return Response.json({ error: 'Plan introuvable' }, { status: 404 })

    const semaines = plan.semaines
    if (!semaines?.[week_index]?.seances?.[session_index]) {
      return Response.json({ error: 'Séance introuvable' }, { status: 404 })
    }

    semaines[week_index].seances[session_index].completed = completed
    if (manual_activity !== undefined) {
      semaines[week_index].seances[session_index].manual_activity = manual_activity
    }
    if (note !== undefined) {
      semaines[week_index].seances[session_index].note = note
    }
    if (fatigue !== undefined) {
      semaines[week_index].seances[session_index].fatigue = fatigue
    }

    const { error: updateError } = await supabase
      .from('plans')
      .update({ semaines })
      .eq('id', plan_id)

    if (updateError) return Response.json({ error: updateError.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

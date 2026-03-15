import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function DELETE(request, { params }) {
  const { id } = await params
  await supabase.from('courses').delete().eq('id', id)
  return Response.json({ success: true })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const body = await request.json()

  // is_favorite via RPC pour contourner le cache schema PostgREST
  if (body.is_favorite !== undefined) {
    const { error } = await supabase.rpc('update_course_favorite', {
      course_id: id,
      fav: body.is_favorite,
    })
    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  // rpe + note via update classique
  const update = {}
  if (body.rpe !== undefined) update.rpe = body.rpe
  if (body.note !== undefined) update.note = body.note
  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from('courses').update(update).eq('id', id)
    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
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
  console.log('[PATCH courses] id:', id, 'body:', body)
  const update = {}
  if (body.rpe !== undefined) update.rpe = body.rpe
  if (body.note !== undefined) update.note = body.note
  if (body.is_favorite !== undefined) update.is_favorite = body.is_favorite
  const { data, error } = await supabase.from('courses').update(update).eq('id', id).select()
  console.log('[PATCH courses] result:', data, 'error:', error)
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  return Response.json({ success: true, updated: data })
}
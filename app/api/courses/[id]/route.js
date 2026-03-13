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
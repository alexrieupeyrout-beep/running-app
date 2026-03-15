import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

export async function DELETE(request) {
  const { userId } = await request.json()
  if (!userId) return Response.json({ error: 'Missing userId' }, { status: 400 })

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}

export async function POST(request) {
  const { pin } = await request.json()
  if (!pin || pin !== process.env.DASHBOARD_PIN) {
    return Response.json({ ok: false }, { status: 401 })
  }
  return Response.json({ ok: true })
}

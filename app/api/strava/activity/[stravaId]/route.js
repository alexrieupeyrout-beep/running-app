import { getValidStravaToken } from '@/lib/strava'

export async function GET(request, { params }) {
  const { stravaId } = await params
  try {
    const token = await getValidStravaToken()
    const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    return Response.json({
      polyline: data.map?.summary_polyline || null,
    })
  } catch (e) {
    return Response.json({ polyline: null, error: e.message })
  }
}

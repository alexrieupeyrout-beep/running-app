import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request) {
  try {
    const data = await request.json()

    // Récupérer l'athlete_id depuis strava_tokens (dernier connecté)
    const { data: tokenRow, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('athlete_id')
      .order('athlete_id', { ascending: false })
      .limit(1)
      .single()

    if (tokenError || !tokenRow) {
      return Response.json({ error: 'Aucun compte Strava connecté' }, { status: 400 })
    }

    const athlete_id = tokenRow.athlete_id

    // Calculer le nombre de semaines disponibles
    const weeksUntilRace = data.raceDate
      ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
      : 12

    // Formater les temps de référence pour le prompt
    const refTimesText = Object.entries(data.refTimes || {})
      .filter(([, v]) => v?.time)
      .map(([k, v]) => `${k} : ${v.time}${v.date ? ` (${v.date})` : ''}`)
      .join(', ') || 'aucun'

    const prompt = `Tu es un coach running expert. Génère un plan d'entraînement personnalisé en JSON.

PROFIL DU COUREUR :
- Course cible : ${data.distance}${data.raceName ? ` (${data.raceName})` : ''}
- Date de la course : ${data.raceDate || 'non précisée'}
- Semaines disponibles : ${weeksUntilRace}
- Volume actuel : ${data.kmPerWeek} par semaine
- Plus longue sortie récente : ${data.longestRun}
- Expérience : ${data.experience}
- Temps de référence : ${refTimesText}
- Objectif : ${data.goal === 'finish' ? 'Terminer la course' : data.goal === 'time' ? `Chrono cible : ${data.targetTime}` : `Performer, record à battre : ${data.targetTime}`}
- Séances par semaine : ${data.sessionsPerWeek}
- Jours préférés : ${(data.preferredDays || []).join(', ')}

INSTRUCTIONS :
- Génère exactement ${Math.min(weeksUntilRace, 16)} semaines de plan
- Chaque semaine a exactement ${data.sessionsPerWeek} séances placées sur les jours préférés
- Structure progressive : fondation → développement → affûtage → récupération
- Les types de séances : "Footing léger", "Sortie longue", "Fractionné", "Allure spécifique", "Récupération active"
- Adapte les distances au niveau actuel (${data.kmPerWeek}/sem) en augmentant progressivement
- Semaine de récupération toutes les 3-4 semaines (volume -30%)

RÉPONDS UNIQUEMENT avec ce JSON valide, sans texte autour :
{
  "semaines": [
    {
      "numero": 1,
      "theme": "Mise en jambes",
      "volume_km": 25,
      "seances": [
        {
          "jour": "Mardi",
          "type": "Footing léger",
          "description": "Course facile à allure conversationnelle",
          "distance_km": 8,
          "allure_cible": "6:00/km",
          "duree_minutes": 48,
          "intensite": "facile",
          "details": "Fréquence cardiaque zone 2, ne pas s'emballer"
        }
      ]
    }
  ]
}`

    const message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText = message.content[0].text.trim()

    // Parser le JSON retourné par Claude
    let planData
    try {
      // Extraire le JSON si Claude a ajouté du texte autour
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      planData = JSON.parse(jsonMatch ? jsonMatch[0] : responseText)
    } catch {
      return Response.json({ error: 'Erreur parsing plan IA', raw: responseText }, { status: 500 })
    }

    // Supprimer l'ancien plan actif si existe
    await supabase
      .from('plans')
      .update({ statut: 'abandonné' })
      .eq('athlete_id', athlete_id)
      .eq('statut', 'actif')

    // Insérer le nouveau plan
    const { data: plan, error: insertError } = await supabase
      .from('plans')
      .insert({
        athlete_id,
        distance: data.distance,
        race_name: data.raceName || null,
        race_date: data.raceDate || null,
        km_per_week: data.kmPerWeek,
        longest_run: data.longestRun,
        experience: data.experience,
        ref_times: data.refTimes || {},
        goal: data.goal,
        target_time: data.targetTime || null,
        sessions_per_week: data.sessionsPerWeek,
        preferred_days: data.preferredDays || [],
        semaines: planData.semaines,
        statut: 'actif',
      })
      .select()
      .single()

    if (insertError) {
      return Response.json({ error: 'Erreur sauvegarde plan', details: insertError }, { status: 500 })
    }

    return Response.json({ success: true, plan_id: plan.id })

  } catch (error) {
    console.error('Erreur génération plan:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

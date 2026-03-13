import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// Génère un plan algorithmique sans appel API
function generatePlan(data) {
  const weeksUntilRace = data.raceDate
    ? Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    : 12
  const totalWeeks = Math.min(Math.max(weeksUntilRace, 4), 16)
  const sessions = data.sessionsPerWeek || 3
  const days = data.preferredDays || ['Mardi', 'Jeudi', 'Samedi']

  const baseVol = parseFloat(data.kmPerWeek) ||
    (data.kmPerWeek === '<30km' ? 20 : data.kmPerWeek === '30-50km' ? 38 : data.kmPerWeek === '>50km' ? 55 : 25)

  const THEMES = [
    'Mise en jambes', 'Construction aérobie', 'Développement', 'Récupération active',
    'Volume progressif', 'Travail foncier', 'Intensification', 'Récupération',
    'Affûtage', 'Pic de forme', 'Consolidation', 'Pré-compétition',
    'Affûtage final', 'Récupération pré-course', 'Activation', 'Semaine de course',
  ]

  const SEANCE_TYPES = ['Footing léger', 'Fractionné', 'Sortie longue', 'Allure spécifique', 'Récupération active']

  const semaines = []

  for (let w = 0; w < totalWeeks; w++) {
    const isRecovery = (w + 1) % 4 === 0
    const phase = w < totalWeeks * 0.35 ? 'fondation'
      : w < totalWeeks * 0.65 ? 'developpement'
      : w < totalWeeks * 0.85 ? 'affutage'
      : 'course'

    const volFactor = isRecovery ? 0.7
      : phase === 'fondation' ? (1 + w * 0.05)
      : phase === 'developpement' ? (1.2 + (w - totalWeeks * 0.35) * 0.04)
      : phase === 'affutage' ? (1.3 - (w - totalWeeks * 0.65) * 0.06)
      : 0.6
    const weekVol = Math.round(baseVol * volFactor)

    const seances = []
    const usedDays = days.slice(0, sessions)

    for (let s = 0; s < sessions; s++) {
      const jour = usedDays[s] || days[s % days.length]
      const isLast = s === sessions - 1
      const isFirst = s === 0

      let type, intensite, distKm, allure, duree, description, details

      if (isLast && sessions >= 3) {
        // Dernière séance = sortie longue
        type = 'Sortie longue'
        intensite = 'facile'
        distKm = Math.round(weekVol * 0.35)
        const paceMin = data.goal === 'finish' ? 6.5 : 5.8
        allure = `${Math.floor(paceMin)}:${Math.round((paceMin % 1) * 60).toString().padStart(2, '0')}/km`
        duree = Math.round(distKm * paceMin)
        description = 'Sortie longue à allure conversationnelle'
        details = 'Restez en zone 2, hydratation toutes les 20 min'
      } else if (!isFirst && !isLast && phase !== 'fondation') {
        // Séance de qualité
        if (phase === 'affutage' || phase === 'course') {
          type = 'Allure spécifique'
          intensite = 'intense'
          distKm = Math.round(weekVol * 0.2)
          const pace = data.targetTime ? estimatePaceFromTime(data.targetTime, data.distance) : 5.0
          allure = `${Math.floor(pace)}:${Math.round((pace % 1) * 60).toString().padStart(2, '0')}/km`
          duree = Math.round(distKm * pace)
          description = `Blocs à allure cible ${data.distance}`
          details = `Échauffement 10 min, 3×${Math.round(distKm / 3 * 10) / 10} km allure course, récup 3 min`
        } else {
          type = 'Fractionné'
          intensite = 'intense'
          distKm = Math.round(weekVol * 0.18)
          allure = '4:30/km'
          duree = Math.round(distKm * 5.5)
          description = 'Intervalles courts pour développer la VMA'
          details = `Échauffement 15 min, 6×400m à allure 5K, récup 1 min 30`
        }
      } else {
        // Footing léger
        type = isRecovery ? 'Récupération active' : 'Footing léger'
        intensite = isRecovery ? 'récupération' : 'facile'
        distKm = Math.round(weekVol * (sessions === 3 ? 0.22 : 0.18))
        const pace = isRecovery ? 6.5 : 6.0
        allure = `${Math.floor(pace)}:${Math.round((pace % 1) * 60).toString().padStart(2, '0')}/km`
        duree = Math.round(distKm * pace)
        description = isRecovery ? 'Footing très facile, jambes légères' : 'Course facile à allure conversationnelle'
        details = 'Fréquence cardiaque zone 2, ne pas forcer'
      }

      seances.push({
        jour,
        type,
        description,
        distance_km: Math.max(distKm, 3),
        allure_cible: allure,
        duree_minutes: Math.max(duree, 20),
        intensite,
        details,
      })
    }

    semaines.push({
      numero: w + 1,
      theme: THEMES[w] || THEMES[w % THEMES.length],
      volume_km: weekVol,
      seances,
    })
  }

  return { semaines }
}

function estimatePaceFromTime(timeStr, distance) {
  const distKm = { '5K': 5, '10K': 10, 'Semi': 21.1, 'Marathon': 42.195 }[distance] || 10
  if (!timeStr) return 5.0
  const parts = timeStr.match(/(\d+)h(\d+)|(\d+):(\d+)/)
  if (!parts) return 5.0
  const totalMin = parts[1] ? parseInt(parts[1]) * 60 + parseInt(parts[2]) : parseInt(parts[3]) + parseInt(parts[4]) / 60
  return totalMin / distKm
}

export async function POST(request) {
  try {
    const data = await request.json()

    const { data: tokenRow, error: tokenError } = await supabase
      .from('strava_tokens')
      .select('athlete_id')
      .order('athlete_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (tokenError || !tokenRow) {
      return Response.json({ error: 'Aucun compte Strava connecté' }, { status: 400 })
    }

    const athlete_id = tokenRow.athlete_id
    const planData = generatePlan(data)

    // Archiver l'ancien plan actif
    await supabase
      .from('plans')
      .update({ statut: 'abandonné' })
      .eq('athlete_id', athlete_id)
      .eq('statut', 'actif')

    const { data: plan, error: insertError } = await supabase
      .from('plans')
      .insert({
        athlete_id,
        distance: data.distance,
        race_name: data.raceName || null,
        race_date: data.raceDate || null,
        km_per_week: data.kmPerWeek,
        longest_run: data.longestRun || null,
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

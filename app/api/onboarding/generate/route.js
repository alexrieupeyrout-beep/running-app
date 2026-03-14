import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
)

// ── Constantes ────────────────────────────────────────────────
const PLAN_DURATIONS = {
  '5K':      { debutant: [4, 6],   intermediaire: [6, 8],   avance: [4, 6]   },
  '10K':     { debutant: [6, 8],   intermediaire: [8, 10],  avance: [6, 8]   },
  'Semi':    { debutant: [10, 12], intermediaire: [10, 12], avance: [8, 10]  },
  'Marathon':{ debutant: [16, 20], intermediaire: [16, 18], avance: [12, 16] },
}

const VOLUME_RANGES = {
  '5K':      { debutant: [15, 25], intermediaire: [25, 40], avance: [25, 40]  },
  '10K':     { debutant: [20, 30], intermediaire: [30, 50], avance: [50, 70]  },
  'Semi':    { debutant: [25, 40], intermediaire: [40, 60], avance: [60, 80]  },
  'Marathon':{ debutant: [30, 50], intermediaire: [50, 80], avance: [80, 120] },
}

const DIST_KM    = { '5K': 5, '10K': 10, 'Semi': 21.1, 'Marathon': 42.195 }
const LONG_MAX   = { '5K': 8, '10K': 14, 'Semi': 22,   'Marathon': 35     }

const THEMES = [
  'Mise en jambes', 'Construction aérobie', 'Développement', 'Récupération active',
  'Volume progressif', 'Travail foncier', 'Intensification', 'Récupération',
  'Affûtage', 'Pic de forme', 'Consolidation', 'Pré-compétition',
  'Affûtage final', 'Récupération pré-course', 'Activation', 'Semaine de course',
]

// ── Helpers ───────────────────────────────────────────────────
function parseKmPerWeek(kmPerWeek, kmPerWeekCustom) {
  if (kmPerWeekCustom) return parseFloat(kmPerWeekCustom)
  if (!kmPerWeek) return 25
  const s = kmPerWeek.toLowerCase()
  // Vérifier les ranges nommés AVANT parseFloat (ex: '30-50km' → parseFloat=30 est incorrect)
  if (s.includes('<30') || s.includes('moins')) return 20
  if ((s.includes('30') && s.includes('50')) || (s.includes('30') && s.includes('60'))) return 40
  if (s.includes('>50') || s.includes('>60')) return 65
  const num = parseFloat(kmPerWeek)
  if (!isNaN(num)) return num
  return 25
}

function getLevel(baseVol) {
  if (baseVol < 30) return 'debutant'
  if (baseVol <= 50) return 'intermediaire'
  return 'avance'
}

function getPlanWeeks(data, level) {
  const dist = data.distance || '10K'
  const [minW, maxW] = (PLAN_DURATIONS[dist] || PLAN_DURATIONS['10K'])[level]
  if (data.raceDate) {
    const weeksUntilRace = Math.floor((new Date(data.raceDate) - new Date()) / (1000 * 60 * 60 * 24 * 7))
    return Math.min(Math.max(weeksUntilRace, minW), maxW)
  }
  return Math.round((minW + maxW) / 2)
}

function fmtPace(paceMin) {
  return `${Math.floor(paceMin)}:${Math.round((paceMin % 1) * 60).toString().padStart(2, '0')}/km`
}

// ── Générateur ────────────────────────────────────────────────
function generatePlan(data) {
  const baseVol    = parseKmPerWeek(data.kmPerWeek, data.kmPerWeekCustom)
  const level      = getLevel(baseVol)
  const totalWeeks = getPlanWeeks(data, level)
  const sessions   = data.sessionsPerWeek || 3
  const days       = (data.preferredDays || ['Mardi', 'Jeudi', 'Samedi']).slice(0, sessions)
  const dist       = data.distance || '10K'

  const maxVol     = (VOLUME_RANGES[dist] || VOLUME_RANGES['10K'])[level][1]
  const longRunMax = LONG_MAX[dist] || 14
  const distKm     = DIST_KM[dist] || 10

  // Affûtage : les 2 dernières semaines
  const taperStart = totalWeeks - 2

  const semaines = []
  let prevBuildVol = baseVol        // volume hors récup, pour continuer la progression après une semaine de récup
  let peakVol      = baseVol
  let longRunKm    = distKm * 0.35  // sortie longue initiale
  let lastIntervalWeek = -2         // pour limiter le fractionné des débutants

  for (let w = 0; w < totalWeeks; w++) {
    const isRecovery = !isTaper(w, taperStart) && (w + 1) % 4 === 0
    const isTaperW   = w >= taperStart
    const phase      = w < totalWeeks * 0.35 ? 'fondation'
      : w < totalWeeks * 0.65 ? 'developpement'
      : w < totalWeeks * 0.85 ? 'affutage'
      : 'course'

    // ── Volume de la semaine ──
    let weekVol
    if (isTaperW) {
      const taperFactor = w === taperStart ? 0.75 : 0.60
      weekVol = Math.round(peakVol * taperFactor)
    } else if (isRecovery) {
      weekVol = Math.round(prevBuildVol * 0.70)
    } else {
      weekVol = Math.min(Math.round(prevBuildVol * 1.10), maxVol)
      prevBuildVol = weekVol
      peakVol = Math.max(peakVol, weekVol)
    }

    // ── Sortie longue ──
    let thisLongRun
    if (isTaperW) {
      thisLongRun = Math.round(longRunMax * (w === taperStart ? 0.65 : 0.50))
    } else if (isRecovery) {
      thisLongRun = Math.max(Math.round(Math.min(longRunKm, longRunMax) * 0.80), 5)
    } else {
      longRunKm = Math.min(longRunKm * 1.12, longRunMax)
      thisLongRun = Math.max(Math.round(longRunKm), 5)
    }

    // ── Fractionné autorisé ? ──
    const intervalAllowed = level !== 'debutant' || (w - lastIntervalWeek >= 2)
    const wantsQuality    = !isRecovery && !isTaperW && phase !== 'fondation'
    const doInterval      = wantsQuality && intervalAllowed
    if (doInterval) lastIntervalWeek = w

    // ── Nombre de séances ──
    const weekSessions = isTaperW
      ? Math.max(2, w === taperStart ? sessions - 1 : sessions - 2)
      : isRecovery
      ? Math.max(2, sessions - 1)
      : w < 2
      ? Math.max(2, sessions - 1)   // rampe semaines 1-2
      : sessions
    const weekDays = days.slice(0, weekSessions)

    // ── Séances ──
    const seances = []
    for (let s = 0; s < weekSessions; s++) {
      const jour      = weekDays[s]
      const isLast    = s === weekSessions - 1
      const isMiddle  = s > 0 && !isLast

      let type, intensite, distKmS, allure, duree, description, details

      if (isLast && weekSessions >= 3) {
        // ── Sortie longue ──
        type        = 'Sortie longue'
        intensite   = 'facile'
        distKmS     = thisLongRun
        const pace  = data.goal === 'finish' ? 6.5 : 6.0
        allure      = fmtPace(pace)
        duree       = Math.round(distKmS * pace)
        description = 'Sortie longue à allure conversationnelle'
        details     = 'Zone 2, hydratation toutes les 20 min, ne pas forcer'

      } else if (isMiddle && wantsQuality) {
        if (doInterval) {
          if (phase === 'affutage' || phase === 'course') {
            // ── Allure spécifique ──
            type        = 'Allure spécifique'
            intensite   = 'intense'
            distKmS     = Math.max(Math.round(weekVol * 0.20), 4)
            const pace  = data.targetTime ? estimatePaceFromTime(data.targetTime, dist) : 5.0
            allure      = fmtPace(pace)
            duree       = Math.round(distKmS * pace)
            description = `Blocs à allure cible ${dist}`
            details     = `Échauffement 10 min, 3×${Math.round(distKmS / 3 * 10) / 10} km allure course, récup 3 min`
          } else {
            // ── Fractionné ──
            type        = 'Fractionné'
            intensite   = 'intense'
            distKmS     = Math.max(Math.round(weekVol * 0.18), 4)
            allure      = '4:30/km'
            duree       = Math.round(distKmS * 5.5)
            description = 'Intervalles pour développer la VMA'
            details     = 'Échauffement 15 min, 6×400m à allure 5K, récup 1 min 30'
          }
        } else {
          // ── Footing progressif (débutant à la place du fractionné) ──
          type        = 'Footing léger'
          intensite   = 'modéré'
          distKmS     = Math.max(Math.round(weekVol * 0.20), 3)
          const pace  = 5.5
          allure      = fmtPace(pace)
          duree       = Math.round(distKmS * pace)
          description = 'Footing progressif avec accélérations'
          details     = 'Démarrer facile, terminer à allure modérée, 4×30 s d\'accélérations en fin de séance'
        }

      } else {
        // ── Footing léger / récupération ──
        type        = (isRecovery || isTaperW) ? 'Récupération active' : 'Footing léger'
        intensite   = (isRecovery || isTaperW) ? 'récupération' : 'facile'
        distKmS     = Math.max(Math.round(weekVol * (weekSessions <= 3 ? 0.22 : 0.18)), 3)
        const pace  = (isRecovery || isTaperW) ? 6.5 : 6.0
        allure      = fmtPace(pace)
        duree       = Math.round(distKmS * pace)
        description = (isRecovery || isTaperW) ? 'Footing très facile, jambes légères' : 'Course facile à allure conversationnelle'
        details     = 'Fréquence cardiaque zone 2, ne pas forcer'
      }

      seances.push({
        jour,
        type,
        description,
        distance_km:    Math.max(distKmS, 3),
        allure_cible:   allure,
        duree_minutes:  Math.max(duree, 20),
        intensite,
        details,
      })
    }

    const theme = isTaperW
      ? (w === taperStart ? 'Affûtage final' : 'Récupération pré-course')
      : isRecovery ? 'Récupération'
      : THEMES[w] || THEMES[w % THEMES.length]

    semaines.push({
      numero:              w + 1,
      theme,
      volume_km:           weekVol,
      volume_endurance_km: Math.round(weekVol * 0.80),
      volume_qualite_km:   Math.round(weekVol * 0.20),
      seances,
    })
  }

  const volumeMaxSemaine = Math.max(...semaines.map(s => s.volume_km))
  const sortieLongueMax  = Math.round(Math.min(longRunKm, longRunMax))

  return {
    semaines,
    meta: {
      niveau:             level,
      duree_recommandee:  (PLAN_DURATIONS[dist] || PLAN_DURATIONS['10K'])[level],
      volume_max_semaine: volumeMaxSemaine,
      sortie_longue_max:  sortieLongueMax,
      ratio_endurance:    '80%',
      ratio_qualite:      '20%',
    },
  }
}

function isTaper(w, taperStart) {
  return w >= taperStart
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

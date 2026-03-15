'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, X, Flag, BookOpen, Apple, Plus } from 'lucide-react'

const INTENSITE_COLORS = {
  'facile':       { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'modéré':       { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  'intense':      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'récupération': { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
}

const SESSION_SHAPE_COLORS = {
  'Footing léger':           '#02A257',
  'Footing progressif':      '#059669',
  'Sortie longue':           '#2563eb',
  'Fractionné':              '#dc2626',
  'Allure spécifique':       '#d97706',
  'Récupération active':     '#7c3aed',
  'Renforcement musculaire': '#0891b2',
  'Sortie vélo':             '#0284c7',
  'Jour de repos':           '#9ca3af',
}

const FATIGUE_LEVELS = [
  { value: 1, label: 'Épuisé',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { value: 2, label: 'Fatigué',  color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { value: 3, label: 'Neutre',   color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
  { value: 4, label: 'En forme', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { value: 5, label: 'En feu',   color: '#02A257', bg: '#f0faf5', border: '#c5e6d5' },
]

const INTERVAL_BLOCK_TYPES = [
  {
    key: 'échauffement',
    match: s => /échauff|echauff|warm/i.test(s),
    label: 'Échauffement', color: '#d97706', bg: '#fffbeb', border: '#fde68a',
  },
  {
    key: 'récup',
    match: s => /r[ée]cup|repos/i.test(s),
    label: 'Récupération', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
  },
  {
    key: 'calme',
    match: s => /retour au calme|calme|cool/i.test(s),
    label: 'Retour au calme', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
  },
  {
    key: 'effort',
    match: s => /\d+\s*[x×]\s*\d+|allure|vma|fraction|interval/i.test(s),
    label: 'Effort', color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
  },
]

function buildNutritionAdvice(seance) {
  const { type, distance_km, duree_minutes } = seance
  const isLong = duree_minutes >= 75 || distance_km >= 15
  const isMedium = duree_minutes >= 45 || distance_km >= 8
  const v = (hashSession ? 0 : 0) // placeholder, will use hash below

  const NUTRITION = {
    'Footing léger': [
      {
        avant: 'Pas besoin de repas spécifique avant cette sortie courte. Un verre d\'eau suffit. Si vous courez plus d\'1h après le repas, évitez les aliments lourds ou gras.',
        pendant: 'Emportez de l\'eau si la sortie dépasse 45 min ou s\'il fait chaud. Sinon, rien de nécessaire.',
        apres: 'Réhydratez-vous avec de l\'eau. Un fruit ou un yaourt suffisent pour la récupération sur ce type de séance légère.',
      },
      {
        avant: 'Une sortie facile ne nécessite pas de préparation nutritionnelle particulière. Attendez au moins 1h30 après un repas pour courir confortablement.',
        pendant: 'L\'eau est votre seul besoin. Si vous transpirez beaucoup, ajoutez une petite pincée de sel à votre gourde.',
        apres: 'Un verre d\'eau et un encas léger (banane, poignée d\'amandes) suffisent pour bien récupérer.',
      },
      {
        avant: 'Si vous courez le matin, une banane ou une tranche de pain avec du miel 30 min avant peut suffire. Si vous courez en journée, votre dernier repas est votre carburant.',
        pendant: 'Hydratation légère si besoin. Pas de ravitaillement solide nécessaire sur cette séance.',
        apres: 'Privilégiez un repas équilibré dans l\'heure qui suit : glucides + protéines pour recharger les stocks et réparer les muscles.',
      },
      {
        avant: 'Légèreté avant tout. Évitez les aliments difficiles à digérer (légumineuses, fritures) dans les 2h précédant la sortie.',
        pendant: 'Buvez selon votre soif. Sur une sortie facile, votre corps gère bien la déshydratation légère.',
        apres: 'Réhydratation et un encas protéiné pour soutenir la récupération musculaire, même légère.',
      },
    ],
    'Footing progressif': [
      {
        avant: 'Un repas léger 2h avant : flocons d\'avoine, pain complet ou riz. Évitez les fibres en excès qui pourraient causer des inconforts en fin de séance quand l\'allure monte.',
        pendant: 'Eau suffisante. Si la séance dure plus d\'1h, une boisson légèrement sucrée peut aider sur les derniers kilomètres.',
        apres: 'Récupération glucido-protéinée dans les 30 min : un smoothie banane + lait ou un yaourt avec des céréales.',
      },
      {
        avant: 'Chargez légèrement en glucides 2h avant : une banane, du pain ou des céréales. La montée progressive en allure sollicite davantage vos réserves que le footing facile.',
        pendant: 'Hydratez-vous régulièrement. Sur les derniers km à allure élevée, votre corps chauffe — buvez avant d\'avoir soif.',
        apres: 'Protéines et glucides dans la demi-heure suivant la séance pour optimiser la récupération musculaire.',
      },
      {
        avant: 'Repas digeste 1h30 à 2h avant. Évitez les graisses et les protéines lourdes qui ralentissent la digestion et peuvent gêner en fin de sortie.',
        pendant: 'Eau en continu. Si vous transpirez abondamment, une boisson isotonique légère est la bienvenue.',
        apres: 'Un repas complet dans l\'heure : pâtes ou riz + œufs ou poisson + légumes. Votre corps a travaillé, récompensez-le.',
      },
      {
        avant: 'Idéalement, courez 2-3h après un repas principal. Si ce n\'est pas possible, une collation légère (banane + eau) 45 min avant fonctionne bien.',
        pendant: 'Hydratation régulière. L\'effort final à allure élevée augmente la sudation — anticipez.',
        apres: 'Réhydratation immédiate puis repas dans l\'heure. Incluez des protéines de qualité pour la récupération musculaire.',
      },
    ],
    'Sortie longue': [
      {
        avant: isLong
          ? `Chargez en glucides la veille au soir : pâtes, riz, pain complet. Le matin, 1h30 avant le départ : porridge ou pain + confiture + banane. Évitez absolument les aliments nouveaux ou difficiles à digérer.`
          : `Un bon petit-déjeuner glucidique 1h30 à 2h avant : flocons d\'avoine, pain, banane. Pas besoin de charger excessivement.`,
        pendant: isLong
          ? `Buvez toutes les 20 min même sans soif (150-200 ml). À partir de 60-75 min d\'effort, prenez un gel ou une datte toutes les 40 min. Anticipez — ne mangez pas quand vous avez faim, il est déjà trop tard.`
          : `Eau toutes les 20-25 min. Si la sortie dépasse 1h15, un gel ou quelques dattes peuvent maintenir votre énergie.`,
        apres: `Récupération prioritaire dans les 30 min : boisson de récupération ou lait chocolaté + banane. Puis dans l\'heure, repas complet riche en protéines et glucides. Ne sautez pas ce repas — votre corps en a besoin.`,
      },
      {
        avant: isLong
          ? `La veille : dîner riche en glucides (pâtes, riz). Le matin : petit-déjeuner connu et bien toléré, 1h30-2h avant le départ. Testez votre alimentation pré-course comme vous le ferez le jour J.`
          : `Petit-déjeuner complet et digeste 1h30 avant. Hydratez-vous bien la veille et le matin.`,
        pendant: isLong
          ? `Plan de ravitaillement : eau toutes les 20 min, glucides toutes les 40-45 min (gel, banane, datte). Entraînez-vous à manger en courant — c\'est une compétence à développer avant la course.`
          : `Eau régulièrement. Un gel ou des fruits secs si l\'effort dépasse 1h15.`,
        apres: `Fenêtre de récupération anabolique dans les 30 min : glucides + protéines (ratio 3:1). Exemple : riz + poulet, ou smoothie protéiné + banane. Continuez à vous hydrater dans les 2h suivantes.`,
      },
      {
        avant: isLong
          ? `Chargez progressivement en glucides dans les 24h précédant la sortie. Évitez les aliments riches en fibres et les épices la veille. Le matin : pain blanc, miel, banane — simple et efficace.`
          : `Repas familier et bien toléré 1h30-2h avant. Pas d\'expérimentation nutritionnelle avant une longue sortie.`,
        pendant: isLong
          ? `Objectif : 30-60g de glucides par heure d\'effort. Alternez eau et boisson isotonique. Gérez votre ravitaillement comme en course — c\'est l\'occasion de tester votre stratégie.`
          : `Eau régulière. Gel ou encas énergétique si vous dépassez 1h15 d\'effort.`,
        apres: `Ne tardez pas à vous réalimenter. Dans les 20-30 min : boisson de récupération ou lait + fruits. Dans l\'heure : repas complet. La récupération nutritionnelle est aussi importante que la séance elle-même.`,
      },
      {
        avant: isLong
          ? `Stratégie éprouvée : dîner pâtes la veille, petit-déjeuner glucidique le matin (porridge, pain, banane). Buvez 500 ml d\'eau 2h avant le départ et encore 250 ml 30 min avant.`
          : `Un petit-déjeuner solide 1h30 avant suffit. Hydratez-vous bien dès le réveil.`,
        pendant: isLong
          ? `Prenez un gel ou équivalent avant même d\'en avoir besoin — ne gérez pas la fringale, prévenez-la. Eau toutes les 15-20 min par temps chaud, toutes les 25 min par temps frais.`
          : `Eau selon la soif et la chaleur. Emportez un encas si vous n\'êtes pas sûr de la durée.`,
        apres: `Récupération en 3 temps : réhydratation (eau + électrolytes), glucides rapides (fruit, jus), puis repas complet protéiné dans l\'heure. Votre corps reconstruit maintenant — nourrissez-le.`,
      },
    ],
    'Fractionné': [
      {
        avant: 'Repas léger et digeste 2h30 à 3h avant : riz blanc, pâtes ou pain + source de protéines légère. Évitez tout aliment gras ou fibreux qui pourrait causer des crampes pendant les efforts intenses.',
        pendant: 'Eau uniquement entre les répétitions. Évitez de boire pendant les efforts — récupérez, buvez, repartez. Une petite gorgée entre chaque répétition suffit.',
        apres: 'Récupération protéinée prioritaire dans les 30 min : œufs, fromage blanc, yaourt grec ou shake protéiné. Les intervalles détruisent les fibres musculaires — elles ont besoin de protéines pour se reconstruire plus fortes.',
      },
      {
        avant: 'La qualité des répétitions dépend en grande partie de votre état digestif. Mangez léger, mangez tôt. Un estomac lourd = des efforts ratés. Évitez les légumes crus et les légumineuses dans les 3h précédant la séance.',
        pendant: 'L\'intensité des intervalles rend la digestion difficile. Eau fraîche entre les efforts, en petites quantités. Pas de gel, pas de boisson sucrée pendant la séance.',
        apres: 'Fenêtre de récupération musculaire : 20-40g de protéines dans les 30 min. Ajoutez des glucides pour recharger le glycogène : un bol de riz + poulet ou un yaourt + granola.',
      },
      {
        avant: 'Petit-déjeuner ou déjeuner 2-3h avant selon l\'heure de la séance. Privilégiez les glucides à index glycémique modéré (avoine, riz complet, pain) pour une énergie stable pendant toute la séance.',
        pendant: 'Hydratation légère uniquement. Les fractionnés sollicitent intensément le système cardiovasculaire — la digestion passe en second plan. Gardez votre gourde pour les récupérations.',
        apres: 'C\'est après les fractionnés que la nutrition de récupération est la plus importante. Protéines de qualité + glucides dans les 30 min. Dormez suffisamment : c\'est pendant le sommeil que les adaptations se produisent.',
      },
      {
        avant: 'Évitez de courir à jeun sur des intervalles — votre performance en pâtirait. Un repas 2h30 avant : riz, quinoa ou pâtes + protéine légère. Si vous courez le matin, une banane et un café 45 min avant peuvent suffire.',
        pendant: 'Eau fraîche entre les répétitions. Si vous transpirez beaucoup, une boisson légèrement salée (électrolytes) aide à maintenir les performances sur les dernières répétitions.',
        apres: 'Double priorité : protéines pour reconstruire les muscles, glucides pour reconstituer le glycogène. Un shake de récupération ou du lait chocolaté + une banane est simple et efficace dans les 20 min suivant la séance.',
      },
    ],
    'Allure spécifique': [
      {
        avant: 'Simulez votre routine de jour de course : même repas, même timing. 2h avant : glucides connus et bien tolérés. C\'est l\'occasion de tester et d\'affiner votre protocole pré-course.',
        pendant: isMedium ? 'Eau régulière. Si la séance dépasse 1h, testez votre stratégie de ravitaillement de course (gels, boissons).' : 'Eau uniquement. Cette distance ne nécessite pas de ravitaillement.',
        apres: 'Récupération glucido-protéinée dans les 30 min. Notez comment vous vous sentez : votre alimentation pré-séance a-t-elle bien fonctionné ? C\'est le moment d\'ajuster votre stratégie de course.',
      },
      {
        avant: 'Traiter cette séance comme un test de course. Reproduisez votre alimentation habituelle du jour J. Hydratez-vous bien la veille et le matin.',
        pendant: isMedium ? 'Testez en conditions réelles : la boisson et les gels que vous utiliserez en course. Votre estomac doit s\'habituer à digérer en courant à cette allure.' : 'Eau selon la soif. La durée ne justifie pas de ravitaillement glucidique.',
        apres: 'Notez votre niveau d\'énergie en fin de séance — c\'est un bon indicateur de la qualité de votre préparation nutritionnelle. Récupérez avec protéines + glucides.',
      },
      {
        avant: `Repas identique à celui que vous ferez avant la course${distance_km ? ` de ${distance_km} km` : ''}. Testez, ajustez, retenez ce qui fonctionne. Rien de nouveau le jour J.`,
        pendant: isMedium ? 'Si vous prévoyez de vous ravitailler en course, faites-le ici aussi. Entraînez votre intestin à absorber des glucides à allure de course.' : 'Eau si nécessaire. Concentrez-vous sur la régularité de l\'allure.',
        apres: 'Récupération standard : protéines + glucides dans les 30 min. Évaluez votre ressenti digestif — un bon signe pour votre préparation de course.',
      },
      {
        avant: 'Mangez comme avant une vraie course : repas connu, bien digeste, 2h avant minimum. Évitez toute expérimentation — vous devez être concentré sur l\'allure, pas sur votre digestion.',
        pendant: isMedium ? 'Hydratation régulière et ravitaillement selon votre plan de course. Testez vos gels à allure spécifique — c\'est maintenant qu\'on vérifie leur tolérance.' : 'Eau légère. Restez concentré sur la régularité.',
        apres: 'Bonne récupération = prochaine séance de qualité. Glucides + protéines dans les 30 min, repas complet dans l\'heure.',
      },
    ],
    'Récupération active': [
      {
        avant: 'Pas de contrainte particulière avant cette sortie légère. Courez avec ce que vous avez dans le ventre. Hydratez-vous bien — la récupération active commence par une bonne hydratation.',
        pendant: 'Eau si la sortie dépasse 40 min ou s\'il fait chaud. Sinon, rien de nécessaire.',
        apres: 'Focalisez-vous sur les protéines pour réparer les muscles sollicités lors des séances précédentes : yaourt grec, œufs, poisson ou fromage blanc. Ajoutez des anti-inflammatoires naturels : curcuma, gingembre, fruits rouges.',
      },
      {
        avant: 'Séance de récupération = besoins nutritionnels réduits avant. L\'important c\'est ce que vous mangez APRÈS, pas avant.',
        pendant: 'Légère hydratation selon la chaleur et la durée. Votre corps ne sollicite pas ses réserves glycogènes sur cette intensité.',
        apres: 'Priorité absolue : protéines de qualité. Votre corps est en phase de reconstruction. Associez-les à des aliments anti-inflammatoires (fruits rouges, noix, huile d\'olive) pour accélérer la récupération.',
      },
      {
        avant: 'Courez bien hydraté. Si vous avez couru fort la veille, buvez 500 ml d\'eau au réveil avant même de partir.',
        pendant: 'Eau selon soif. Cette séance légère ne justifie pas de ravitaillement particulier.',
        apres: 'C\'est le repas d\'après qui compte le plus : protéines + légumes riches en antioxydants. Évitez l\'alcool qui perturbe la récupération musculaire. Dormez suffisamment.',
      },
      {
        avant: 'Aucune contrainte. La récupération active est une séance de service — le carburant nécessaire est minimal.',
        pendant: 'Hydratation légère si besoin. Profitez de la sortie pour évaluer votre niveau de récupération général.',
        apres: 'Magnésium, protéines et bons lipides : c\'est le trio de la récupération. Saumon, sardines ou maquereau + légumes verts + quelques noix — un repas de récupération idéal.',
      },
    ],
    'Renforcement musculaire': [
      {
        avant: 'Repas normal 1h30-2h avant. Privilégiez les protéines et les glucides complexes. Le renforcement sollicite les fibres musculaires — elles ont besoin de carburant pour travailler efficacement.',
        pendant: 'Eau uniquement. Le renforcement ne justifie pas de ravitaillement glucidique. Restez bien hydraté entre les séries.',
        apres: 'C\'est le moment le plus important pour la nutrition : les protéines dans les 30 min suivant la séance accélèrent la reconstruction musculaire. Yaourt grec, œufs, fromage blanc ou shake protéiné — visez 20-30g de protéines.',
      },
      {
        avant: 'Un repas léger protéiné 2h avant : poulet, œufs ou légumineuses + glucides modérés. Évitez les aliments lourds qui alourdiront la séance.',
        pendant: 'Eau fraîche entre les séries. Pour les séances longues ou intenses, une boisson électrolytique légère peut aider.',
        apres: 'Fenêtre anabolique dans les 30 min : protéines de qualité + glucides rapides (ratio 1:2). Votre corps reconstruit maintenant — ne manquez pas cette fenêtre.',
      },
      {
        avant: 'Le renforcement ne nécessite pas de protocole nutritionnel élaboré. Mangez normalement 1h30-2h avant, en incluant des protéines pour préparer les muscles au travail.',
        pendant: 'Hydratation régulière. Le renforcement fait transpirer — compensez avec de l\'eau.',
        apres: 'Protéines prioritaires dans l\'heure suivant la séance. Associez à des glucides pour optimiser la récupération musculaire et recharger les réserves énergétiques.',
      },
      {
        avant: 'Petit-déjeuner ou repas complet 2h avant, incluant protéines et glucides. Un estomac trop plein nuira à la qualité des mouvements — respectez le délai.',
        pendant: 'Eau entre chaque série. Si la séance dépasse 1h, une boisson légèrement sucrée peut maintenir les performances.',
        apres: 'La fenêtre de récupération post-renforcement est critique. 20-40g de protéines dans les 30 min : œufs, poulet, poisson ou protéines végétales. Accompagnez de fruits ou de féculents.',
      },
    ],
    'Sortie vélo': [
      {
        avant: 'La sortie vélo de récupération n\'exige pas de préparation nutritionnelle particulière. Restez bien hydraté et mangez normalement.',
        pendant: 'Eau régulière selon la durée et la chaleur. Pour une sortie récupération courte, rien d\'autre n\'est nécessaire.',
        apres: 'Réhydratation et repas équilibré. Le vélo de récupération ne sollicite pas suffisamment les réserves pour nécessiter une stratégie nutritionnelle spécifique.',
      },
      {
        avant: 'Sortie légère = besoins nutritionnels réduits. Mangez normalement et buvez bien avant de partir.',
        pendant: 'Une gourde d\'eau suffit pour une sortie récupération. Buvez régulièrement même sans soif.',
        apres: 'Repas normal post-séance. Profitez de cette sortie pour soigner votre alimentation de récupération : légumes, protéines, bons gras.',
      },
      {
        avant: 'Pas de contrainte spécifique. Si la sortie dépasse 1h30, un petit snack glucidique 45 min avant peut être utile.',
        pendant: 'Eau ou boisson légèrement isotonique si la durée dépasse 1h. Pédalage récupération = faibles besoins caloriques.',
        apres: 'Réhydratation et alimentation équilibrée. Profitez du contexte récupérateur pour manger léger et nutritif.',
      },
      {
        avant: 'Mangez normalement. Le vélo de récupération ne demande pas de charge glucidique.',
        pendant: 'Hydratation selon soif et chaleur. Pour une sortie récupération, pas besoin de ravitaillement.',
        apres: 'Un repas riche en légumes, protéines et bons lipides. Vous êtes en phase de récupération — nourrissez-la.',
      },
    ],
    'Jour de repos': [
      {
        avant: 'Pas de séance, pas de contrainte nutritionnelle particulière. Mangez équilibré, en écoutant votre faim.',
        pendant: 'Restez bien hydraté tout au long de la journée — 1,5 à 2L d\'eau minimum, plus si il fait chaud.',
        apres: 'Journée idéale pour soigner votre alimentation de fond : légumes, protéines maigres, bons lipides (avocat, noix, huile d\'olive). Évitez l\'alcool qui perturbe la récupération.',
      },
      {
        avant: 'Profitez de cette journée pour recharger intelligemment : glucides complexes (riz, pâtes, quinoa) si vous avez une séance intense le lendemain.',
        pendant: 'Hydratation régulière. Jour de repos = soins nutritionnels prioritaires.',
        apres: 'Un repas anti-inflammatoire : saumon, légumes colorés, curcuma, fruits rouges. Votre corps répare, aidez-le.',
      },
      {
        avant: 'Mangez à votre faim, sans excès. Jour de repos ne veut pas dire "tout manger" — restez dans vos habitudes saines.',
        pendant: 'Eau et tisanes. Évitez les boissons sucrées ou alcoolisées qui nuisent à la récupération.',
        apres: 'Concentrez-vous sur les micronutriments aujourd\'hui : fruits, légumes, noix. Ce sont eux qui soutiennent la récupération au niveau cellulaire.',
      },
      {
        avant: 'Jour de repos = opportunité nutritionnelle. Préparez bien votre prochain effort en mangeant des glucides de qualité si nécessaire.',
        pendant: 'Hydratation correcte tout au long de la journée. Le repos n\'enlève pas le besoin d\'eau.',
        apres: 'Dormez tôt, mangez léger le soir, optimisez votre récupération. La nuit qui suit un jour de repos est souvent la plus réparatrice.',
      },
    ],
  }

  return NUTRITION[type] || null
}

function hashSession(seance) {
  const str = `${seance.type}${seance.distance_km}${seance.duree_minutes}${seance.allure_cible}${seance.details}`
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0 }
  return h
}

function buildCoachNarrative(seance) {
  const { type, details, distance_km, duree_minutes, allure_cible } = seance
  const pace = allure_cible ? `à ${allure_cible}` : null
  const dist = distance_km ? `${distance_km} km` : null
  const duree = duree_minutes ? (duree_minutes >= 60 ? `${Math.floor(duree_minutes / 60)}h${String(duree_minutes % 60).padStart(2, '0')}` : `${duree_minutes} min`) : null
  const det = details ? `"${details}"` : null
  const v = hashSession(seance) % 4

  const TEMPLATES = {
    'Footing léger': [
      `${det ? det + '. ' : ''}Restez en zone d'endurance fondamentale${dist ? ` sur ces ${dist}` : ''} — vous devez pouvoir tenir une conversation sans être essoufflé. Si vous sentez que vous forcez, ralentissez sans hésiter. Ces sorties douces construisent silencieusement votre moteur aérobie : ne les sous-estimez pas.`,
      `${det ? det + '. ' : ''}L'objectif aujourd'hui n'est pas la performance, c'est le volume${dist ? ` : ${dist}` : ''} à allure légère${pace ? ` (${pace})` : ''}. Les jambes doivent rester légères du début à la fin. Si elles sont lourdes, c'est un signal : ralentissez, c'est la bonne décision.`,
      `${det ? det + '. ' : ''}Footing de récupération et d'endurance${dist ? ` : ${dist}` : ''}${duree ? `, ${duree}` : ''}. Courez à une allure où vous vous sentez presque "trop lent" — c'est exactement ça. Ces kilomètres faciles représentent 80% du travail d'un coureur efficace.`,
      `${det ? det + '. ' : ''}Séance en endurance de base${dist ? ` de ${dist}` : ''}${pace ? ` à ${pace}` : ''}. Ne cédez pas à la tentation d'aller plus vite : la valeur de cette séance est dans sa régularité et son volume, pas dans l'intensité. Profitez-en pour courir à l'instinct, sans regarder constamment votre montre.`,
    ],
    'Footing progressif': [
      `${det ? det + '. ' : ''}Commencez${dist ? ` ces ${dist}` : ''} à allure très confortable, comme un footing facile. Augmentez progressivement le rythme toutes les 10-15 minutes. La règle : chaque km doit être légèrement plus rapide que le précédent${pace ? `, pour finir autour de ${pace}` : ''}. Ne cherchez pas à terminer à fond — la maîtrise est le vrai objectif.`,
      `${det ? det + '. ' : ''}Séance de progression${dist ? ` sur ${dist}` : ''}${duree ? ` (${duree})` : ''}. Les premiers kilomètres sembleront trop lents — c'est voulu. Ce type de séance apprend à votre corps à s'adapter à l'effort croissant, une compétence clé en course. Soyez patient au départ, audacieux sur la fin.`,
      `${det ? det + '. ' : ''}Départ tranquille, arrivée engagée${dist ? ` sur ${dist}` : ''}. La progression doit être fluide et régulière — pas de coup d'accélérateur brutal à mi-parcours. Si vous finissez${pace ? ` autour de ${pace}` : ''} en ayant encore de la marge, vous avez parfaitement exécuté la séance.`,
      `${det ? det + '. ' : ''}Footing progressif${dist ? ` de ${dist}` : ''} : c'est une séance qui se mérite. La patience du début vous permet l'engagement de la fin. Construisez l'effort par couches, sentez votre corps se réchauffer et trouver son rythme. C'est une des séances les plus formatives du plan.`,
    ],
    'Sortie longue': [
      `${det ? det + '. ' : ''}La sortie longue${dist ? ` de ${dist}` : ''} est l'âme de votre préparation. Partez délibérément lentement${pace ? ` — autour de ${pace}` : ''} — les premiers kilomètres doivent paraître trop faciles. Hydratez-vous toutes les 20 minutes même si vous n'avez pas soif. Les derniers kilomètres révèlent votre vraie forme : restez maîtrisé jusqu'au bout.`,
      `${det ? det + '. ' : ''}${dist ? `Ces ${dist}` : 'Cette sortie'} vont solliciter votre endurance aérobie, votre résistance mentale et vos réserves énergétiques. Prenez soin de bien vous alimenter avant, et emportez de quoi vous ravitailler si la durée dépasse 1h15${duree ? ` (${duree} aujourd'hui)` : ''}. Ne cédez pas à la tentation d'aller vite en début de sortie.`,
      `${det ? det + '. ' : ''}Sortie longue${dist ? ` de ${dist}` : ''}${duree ? `, soit environ ${duree}` : ''} sur les jambes. C'est la séance où vous simulez l'effort de la course. Courez${pace ? ` à ${pace}` : ' lentement'}, gérez votre énergie et votre hydratation. La vraie victoire c'est d'arriver au bout en contrôle, pas épuisé.`,
      `${det ? det + '. ' : ''}Pilier de votre semaine d'entraînement${dist ? ` : ${dist}` : ''}${pace ? ` à ${pace}` : ''}. Choisissez un parcours agréable, mettez un podcast ou de la musique si ça aide, et installez-vous dans l'effort long. Ce type de séance développe des adaptations physiologiques profondes — mitochondries, capillaires, réserves glycogènes — qui ne se voient pas mais font toute la différence le jour J.`,
    ],
    'Fractionné': [null, null, null, null], // handled separately
    'Allure spécifique': [
      `${det ? det + '. ' : ''}Séance de travail à allure course${dist ? ` sur ${dist}` : ''}${pace ? ` (${pace})` : ''}. L'objectif n'est pas de tout donner, c'est d'intégrer ce rythme dans vos jambes et votre tête. Restez concentré sur la régularité — une allure stable est plus efficace que des variations. Sentez ce rythme, appropriez-vous le.`,
      `${det ? det + '. ' : ''}Vous allez courir${pace ? ` à ${pace}` : ' à allure cible'}${dist ? ` pendant ${dist}` : ''}${duree ? ` (${duree})` : ''} : c'est l'allure que vous devrez tenir en course. L'enjeu psychologique est aussi important que physique — apprenez à trouver ce rythme confortable-inconfortable et à y rester. Ni trop vite, ni trop lent.`,
      `${det ? det + '. ' : ''}Allure spécifique${dist ? ` sur ${dist}` : ''}${pace ? ` à ${pace}` : ''} : répétition mentale autant que physique. Chaque kilomètre couru à cette allure renforce la mémoire musculaire du rythme cible. Si vous dérivez, revenez doucement à l'allure — ne compensez pas par une accélération brutale.`,
      `${det ? det + '. ' : ''}${dist ? `Ces ${dist}` : 'Cette séance'}${pace ? ` à ${pace}` : ''} sont un investissement direct sur votre performance le jour J. Courez avec intention et régularité${duree ? ` pendant ${duree}` : ''}. C'est en répétant ces blocs à allure spécifique que vous construisez la confiance nécessaire pour tenir le rythme en course.`,
    ],
    'Récupération active': [
      `${det ? det + '. ' : ''}Séance de récupération active${dist ? ` : ${dist}` : ''}${pace ? ` à ${pace}` : ''} — ne trichez pas avec l'allure. L'objectif est de faire circuler le sang dans les muscles pour évacuer les toxines et accélérer la réparation. Si vos jambes sont lourdes ou douloureuses, c'est normal : c'est justement pour ça que cette séance existe.`,
      `${det ? det + '. ' : ''}Après les efforts de cette semaine, votre corps a besoin de cette sortie légère${dist ? ` de ${dist}` : ''}. Courez sans montre si possible, à l'allure qui vous semble "ridiculement lente". Cette séance est aussi importante dans votre plan que les séances intenses — ne la négligez pas ou ne la sautez pas.`,
      `${det ? det + '. ' : ''}Récupération active${dist ? ` sur ${dist}` : ''}${duree ? ` (${duree})` : ''}. Gardez une foulée légère et décontractée${pace ? `, allure cible ${pace}` : ''}. Si vous avez couru fort ces derniers jours, vous sentirez peut-être une légèreté qui revient au fil des kilomètres — c'est le signe que la séance fait son travail.`,
      `${det ? det + '. ' : ''}Sortie douce de régénération${dist ? ` : ${dist}` : ''}. L'erreur classique est de courir trop vite "parce que ça va bien" — résistez à cette envie. La valeur est dans l'intensité basse. Profitez de cette sortie pour vous reconnecter à la course de façon légère, sans pression de performance.`,
    ],
    'Renforcement musculaire': [
      `${det ? det + '. ' : ''}Le renforcement musculaire est le complément indispensable de votre entraînement course${duree ? ` (${duree})` : ''}. Des muscles forts protègent vos articulations, améliorent votre foulée et retardent la fatigue. Concentrez-vous sur la qualité d'exécution — la course sollicite tout le bas du corps, renforcez-le avec soin.`,
      `${det ? det + '. ' : ''}Séance de renforcement${duree ? ` de ${duree}` : ''} : c'est ici que vous construisez la fondation musculaire qui vous permettra de courir plus vite sans blessure. Respectez les temps de repos entre les séries, et ne négligez pas le gainage — votre tronc est votre moteur.`,
      `${det ? det + '. ' : ''}Le renforcement musculaire${duree ? ` (${duree})` : ''} est souvent la séance que les coureurs sautent en premier — c'est une erreur. Quadriceps, ischio-jambiers, mollets et fessiers renforcés = blessures évitées et secondes gagnées. Faites-en une priorité.`,
      `${det ? det + '. ' : ''}Entraînement croisé${duree ? ` de ${duree}` : ''} : travaillez les groupes musculaires que la course seule ne sollicite pas suffisamment. Fentes, squats et gainage pour une foulée plus stable et économique.`,
    ],
    'Sortie vélo': [
      `${det ? det + '. ' : ''}Sortie de récupération active sur vélo${duree ? ` (${duree})` : ''}. Le vélo est l'allié du coureur : il maintient le niveau cardiovasculaire sans l'impact du sol. Pédalez à cadence légère, en zone confortable — votre corps récupère pendant que vos jambes restent actives.`,
      `${det ? det + '. ' : ''}Cross-training vélo${duree ? ` (${duree})` : ''} : une cadence élevée (90 tr/min) et une intensité basse drainent les acides lactiques sans créer de nouvelles contraintes. Idéal après une semaine chargée.`,
      `${det ? det + '. ' : ''}Sortie vélo légère${duree ? ` de ${duree}` : ''}. L'entraînement croisé réduit le risque de blessure de surcharge lié à la course. Pas d'objectif de vitesse — juste un pédalage fluide et récupérateur.`,
      `${det ? det + '. ' : ''}Vélo de récupération${duree ? ` (${duree})` : ''} : la séance parfaite pour les jours où vos jambes ont besoin de souffler. Restez en zone 1-2, savourez le mouvement sans contrainte.`,
    ],
    'Jour de repos': [
      `Journée de récupération complète. Le repos est aussi un entraînement — c'est pendant la récupération que votre corps s'adapte et progresse. Dormez suffisamment, mangez bien, préparez mentalement la suite.`,
      `Repos actif : vous n'avez rien à faire aujourd'hui, et c'est voulu. Les fibres musculaires se reconstruisent, les réserves glycogènes se reconstituent. Ne cédez pas à la tentation de "rattraper" une séance — respectez votre corps.`,
      `Jour sans entraînement. La progression vient du cycle effort-récupération, et le repos en est une composante essentielle. Une marche légère ou quelques étirements doux suffisent si vous ressentez le besoin de bouger.`,
      `Récupération totale. Ces jours de repos font partie de votre entraînement au même titre que vos sorties. Soignez votre alimentation, votre hydratation et votre sommeil — les vrais piliers de la performance.`,
    ],
  }

  const variants = TEMPLATES[type]
  if (!variants) return details || null
  if (type === 'Fractionné') return null
  return variants[v] || details || null
}

function parseIntervalBlocks(text) {
  if (!text) return []
  return text.split(/[,;]/).map(s => s.trim()).filter(Boolean).map(seg => {
    const type = INTERVAL_BLOCK_TYPES.find(t => t.match(seg))
    return type ? { ...type, text: seg } : { key: 'default', text: seg, label: '', color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' }
  })
}

function buildIntervalNarrative(blocks) {
  const efforts = blocks.filter(b => b.key === 'effort')
  const recups = blocks.filter(b => b.key === 'récup')
  const warmup = blocks.find(b => b.key === 'échauffement')
  const cooldown = blocks.find(b => b.key === 'calme')

  const parts = []
  if (warmup) parts.push(`Commencez par ${warmup.text.toLowerCase().replace(/^échauffement\s*/i, 'un échauffement de ')}`)
  if (efforts.length > 0) {
    const effortText = efforts.map(e => e.text).join(', ')
    parts.push(`enchaînez ${effortText}`)
  }
  if (recups.length > 0) {
    parts.push(`avec ${recups.map(r => r.text.toLowerCase()).join(', ')} entre chaque effort`)
  }
  if (cooldown) parts.push(`terminez par ${cooldown.text.toLowerCase().replace(/^retour au calme\s*/i, 'un retour au calme de ')}`)

  const base = parts.length > 0
    ? parts.join(', ') + '.'
    : blocks.map(b => b.text).join(', ') + '.'

  return base.charAt(0).toUpperCase() + base.slice(1) + ' Respectez bien les temps de récupération pour maintenir la qualité de chaque répétition.'
}

function NutritionSection({ seance, hash }) {
  const variants = buildNutritionAdvice(seance)
  if (!variants) return null
  const advice = variants[hash % variants.length]
  const defaultOpen = ['Sortie longue', 'Fractionné'].includes(seance.type)
  const [open, setOpen] = useState(defaultOpen)

  const blocks = [
    { key: 'avant', label: 'Avant', icon: '🕐', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { key: 'pendant', label: 'Pendant', icon: '⚡', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { key: 'apres', label: 'Après', icon: '✓', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  ]

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#f7f7f8', border: '1px solid #e8e8e8', borderRadius: open ? '12px 12px 0 0' : '12px', padding: '0.65rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <Apple size={12} strokeWidth={2} />Nutrition & hydratation
          </span>
        <span style={{ fontSize: '0.65rem', color: '#b0b3c1', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {blocks.map(b => (
            <div key={b.key} style={{ borderLeft: `3px solid ${b.border}`, paddingLeft: '0.75rem' }}>
              <span style={{ fontSize: '0.58rem', fontWeight: '700', color: b.color, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '0.2rem' }}>{b.label}</span>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#464754', lineHeight: 1.5 }}>{advice[b.key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollapsibleInstructions({ text, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: '#f7f7f8', border: '1px solid #e8e8e8', borderRadius: open ? '12px 12px 0 0' : '12px', padding: '0.65rem 1rem', cursor: 'pointer', transition: 'all 0.2s' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            <BookOpen size={12} strokeWidth={2} />Instructions
          </span>
        <span style={{ fontSize: '0.65rem', color: '#b0b3c1', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
      </button>
      {open && (
        <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem 1rem' }}>
          <p style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.55, margin: 0 }}>{text}</p>
        </div>
      )}
    </div>
  )
}

function NoteField({ note, fatigue, onSave }) {
  const [open, setOpen] = useState(false)
  const [localFatigue, setLocalFatigue] = useState(fatigue || null)
  const hasContent = note || fatigue

  const handleFatigue = async (val) => {
    const newVal = localFatigue === val ? null : val
    setLocalFatigue(newVal)
    onSave({ note, fatigue: newVal })
  }

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: open ? '0.75rem' : 0 }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem 0', fontSize: '0.78rem', fontWeight: '500', color: hasContent ? '#02A257' : '#9ea0ae' }}
        >
          {open ? <span style={{ fontSize: '0.65rem' }}>▾</span> : <Plus size={13} strokeWidth={2.5} />}
          {hasContent ? 'Votre ressenti' : 'Ajouter votre ressenti'}
        </button>
      </div>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {FATIGUE_LEVELS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFatigue(f.value)}
                style={{
                  flex: 1, padding: '0.35rem 0', borderRadius: '8px', border: `1.5px solid ${localFatigue === f.value ? f.border : '#e8e8e8'}`,
                  background: localFatigue === f.value ? f.bg : 'white',
                  color: localFatigue === f.value ? f.color : '#b0b3c1',
                  fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <textarea
            defaultValue={typeof note === 'string' ? note : ''}
            placeholder="Comment s'est passée cette séance ? Tes jambes, ta tête, la météo…"
            onBlur={(e) => onSave({ note: e.target.value, fatigue: localFatigue })}
            style={{ width: '100%', minHeight: '68px', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1.5px solid #e8e8e8', fontSize: '0.82rem', color: '#464754', lineHeight: 1.5, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>
      )}
    </div>
  )
}

function SessionShape({ type, size = 28 }) {
  const color = SESSION_SHAPE_COLORS[type] || '#9ea0ae'
  const s = size
  const sw = s * 0.12
  if (type === 'Footing léger' || type === 'Footing progressif') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke={color} strokeWidth={sw} /></svg>
  }
  if (type === 'Sortie longue') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="14" rx="12" ry="7" stroke={color} strokeWidth={sw} /></svg>
  }
  if (type === 'Fractionné') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><polyline points="17,3 10,15 15,15 11,25" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></svg>
  }
  if (type === 'Allure spécifique') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><polygon points="14,3 25,14 14,25 3,14" stroke={color} strokeWidth={sw} strokeLinejoin="round" /></svg>
  }
  if (type === 'Récupération active') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><path d="M14 5 A9 9 0 1 1 5 14" stroke={color} strokeWidth={sw} strokeLinecap="round" /><polyline points="5,10 5,14 9,14" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>
  }
  if (type === 'Renforcement musculaire') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <rect x="2" y="11" width="5" height="6" rx="2" stroke={color} strokeWidth={sw}/>
      <rect x="21" y="11" width="5" height="6" rx="2" stroke={color} strokeWidth={sw}/>
      <rect x="5" y="8" width="4" height="12" rx="1.5" stroke={color} strokeWidth={sw}/>
      <rect x="19" y="8" width="4" height="12" rx="1.5" stroke={color} strokeWidth={sw}/>
      <line x1="9" y1="14" x2="19" y2="14" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  }
  if (type === 'Sortie vélo') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <circle cx="8" cy="18" r="6" stroke={color} strokeWidth={sw}/>
      <circle cx="20" cy="18" r="6" stroke={color} strokeWidth={sw}/>
      <polyline points="8,18 13,8 16,8 20,18" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="13" cy="8" r="1.5" fill={color}/>
    </svg>
  }
  if (type === 'Jour de repos') {
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none">
      <path d="M10 8 C10 14 18 14 18 20" stroke={color} strokeWidth={sw} strokeLinecap="round"/>
      <circle cx="14" cy="14" r="9" stroke={color} strokeWidth={sw} strokeDasharray="3 2"/>
    </svg>
  }
  return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><rect x="4" y="4" width="20" height="20" rx="5" stroke={color} strokeWidth={sw} /></svg>
}

function StravaLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FC4C02">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
    </svg>
  )
}

function fmtPaceMin(paceMin) {
  if (!paceMin) return '—'
  const m = Math.floor(paceMin)
  const s = Math.round((paceMin % 1) * 60)
  return `${m}:${String(s).padStart(2, '0')}/km`
}

const MOCK_STRAVA = {
  nom: 'Sortie du mardi matin',
  distance_km: 9.2,
  duree_minutes: 51,
  allure_moyenne: 5.52,
  frequence_cardiaque_moy: 158,
  strava_id: 99999,
}

function getActivity(seance, mockOverride = null) {
  if (mockOverride) return { activity: mockOverride, source: 'strava' }
  if (seance.strava_activity) return { activity: seance.strava_activity, source: 'strava' }
  if (seance.manual_activity) return { activity: seance.manual_activity, source: 'manual' }
  return { activity: null, source: null }
}

const DAY_OFFSETS = {
  'Lundi': 0, 'Lun': 0, 'Mardi': 1, 'Mar': 1, 'Mercredi': 2, 'Mer': 2,
  'Jeudi': 3, 'Jeu': 3, 'Vendredi': 4, 'Ven': 4, 'Samedi': 5, 'Sam': 5, 'Dimanche': 6, 'Dim': 6,
}

const T = {
  card:    { background: 'white', border: "1px solid #e8e8e8", borderRadius: '16px' },
  label:   { fontSize: '0.7rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em' },
  primary: { color: '#282830' },
  muted:   { color: '#656779' },
  faint:   { color: '#9ea0ae' },
  green:   { color: '#02A257' },
}

function formatTargetTime(str) {
  if (!str) return str
  str = str.trim().toLowerCase().replace(/\s/g, '')
  let totalMin = null
  const hm = str.match(/(\d+)h(\d+)/)
  if (hm) { totalMin = parseInt(hm[1]) * 60 + parseInt(hm[2]); }
  else { const mm = str.match(/^(\d+):(\d+)$/); if (mm) totalMin = parseInt(mm[1]) + parseInt(mm[2]) / 60 }
  if (totalMin === null) return str
  const h = Math.floor(totalMin / 60)
  const m = Math.round(totalMin % 60)
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

export default function PlanDetailClient({ plan }) {
  const DAY_ORDER_SORT = { 'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4, 'Samedi': 5, 'Dimanche': 6 }
  const [localSemaines, setLocalSemaines] = useState(
    (plan.semaines || []).map(sem => ({
      ...sem,
      seances: [...(sem.seances || [])].sort((a, b) => (DAY_ORDER_SORT[a.jour] ?? 7) - (DAY_ORDER_SORT[b.jour] ?? 7)),
    }))
  )
  const [selectedSession, setSelectedSession] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ date: new Date().toISOString().split('T')[0], type_activite: 'Run', distance_km: '', duree_minutes: '', allure_moyenne: '', frequence_cardiaque_moy: '', denivele_positif: '', calories: '', note: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [addError, setAddError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const semaines = localSemaines
  const totalWeeks = semaines.length
  const createdAt = new Date(plan.created_at)
  const today = new Date()
  const weeksPassed = Math.floor((today - createdAt) / (1000 * 60 * 60 * 24 * 7))
  const currentWeekIndex = Math.min(Math.max(weeksPassed, 0), totalWeeks - 1)
  const [selectedWeek, setSelectedWeek] = useState(currentWeekIndex)

  const weekScrollRef = useRef(null)
  const weekPillRefs = useRef([])
  useEffect(() => {
    const pill = weekPillRefs.current[selectedWeek]
    const container = weekScrollRef.current
    if (!pill || !container) return
    const pillLeft = pill.offsetLeft
    const pillRight = pillLeft + pill.offsetWidth
    const containerLeft = container.scrollLeft
    const containerRight = containerLeft + container.offsetWidth
    if (pillLeft < containerLeft) {
      container.scrollTo({ left: pillLeft - 8, behavior: 'smooth' })
    } else if (pillRight > containerRight) {
      container.scrollTo({ left: pillRight - container.offsetWidth + 8, behavior: 'smooth' })
    }
  }, [selectedWeek])

  const raceDate = plan.race_date ? new Date(plan.race_date) : null
  const weeksLeft = raceDate ? Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24 * 7)) : null

  const semaine = semaines[selectedWeek]
  if (!semaine) return null

  const weekStart = new Date(createdAt)
  weekStart.setDate(weekStart.getDate() + selectedWeek * 7)
  const dow = weekStart.getDay() === 0 ? 7 : weekStart.getDay()
  const weekMonday = new Date(weekStart)
  weekMonday.setDate(weekStart.getDate() - (dow - 1))
  const weekSunday = new Date(weekMonday)
  weekSunday.setDate(weekMonday.getDate() + 6)
  const fmtDay = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const getSessionDate = (jour) => {
    const offset = DAY_OFFSETS[jour] ?? 0
    const d = new Date(weekMonday)
    d.setDate(weekMonday.getDate() + offset)
    return fmtDay(d)
  }

  const handleAddActivity = async () => {
    setAddError(null)
    const activityDate = new Date(addForm.date + 'T12:00:00')
    const todayMidnight = new Date(); todayMidnight.setHours(23, 59, 59, 999)
    if (activityDate > todayMidnight) {
      setAddError("Tu ne peux pas ajouter une activité dans le futur.")
      return
    }
    setAddLoading(true)
    await fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const DAY_IDX = { 0: ['dim','dimanche'], 1: ['lun','lundi'], 2: ['mar','mardi'], 3: ['mer','mercredi'], 4: ['jeu','jeudi'], 5: ['ven','vendredi'], 6: ['sam','samedi'] }
    const createdDow = createdAt.getDay() === 0 ? 7 : createdAt.getDay()
    const planMonday = new Date(createdAt)
    planMonday.setDate(createdAt.getDate() - (createdDow - 1))
    planMonday.setHours(0, 0, 0, 0)
    const daysDiff = Math.floor((activityDate - planMonday) / (1000 * 60 * 60 * 24))
    const weekIndex = Math.floor(daysDiff / 7)
    const dowActivity = activityDate.getDay()
    const matchingDays = DAY_IDX[dowActivity] || []
    const manualActivity = {
      nom: addForm.note || 'Activité manuelle',
      note: addForm.note || null,
      type_activite: addForm.type_activite,
      distance_km: addForm.distance_km ? parseFloat(addForm.distance_km) : null,
      duree_minutes: addForm.duree_minutes ? parseInt(addForm.duree_minutes) : null,
      allure_moyenne: addForm.allure_moyenne ? parseFloat(addForm.allure_moyenne) : null,
      frequence_cardiaque_moy: addForm.frequence_cardiaque_moy ? parseInt(addForm.frequence_cardiaque_moy) : null,
      denivele_positif: addForm.denivele_positif ? parseInt(addForm.denivele_positif) : null,
      calories: addForm.calories ? parseInt(addForm.calories) : null,
    }
    if (weekIndex >= 0 && weekIndex < localSemaines.length) {
      const week = localSemaines[weekIndex]
      const sessionIndex = week.seances?.findIndex(s => matchingDays.includes(s.jour?.toLowerCase()))
      if (sessionIndex >= 0) {
        setLocalSemaines(prev => prev.map((w, wi) => wi !== weekIndex ? w : {
          ...w,
          seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: true, manual_activity: manualActivity }),
        }))
        await fetch('/api/plan/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: true, manual_activity: manualActivity }),
        })
      }
    }
    setAddLoading(false)
    setAddSuccess(true)
    setTimeout(() => {
      setAddSuccess(false)
      setAddOpen(false)
      setAddForm(f => ({ ...f, distance_km: '', duree_minutes: '', allure_moyenne: '', frequence_cardiaque_moy: '', denivele_positif: '', calories: '', note: '' }))
    }, 1500)
  }

  const deleteActivity = async (weekIndex, sessionIndex) => {
    setLocalSemaines(prev => prev.map((w, wi) => wi !== weekIndex ? w : {
      ...w,
      seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: false, strava_activity: null, manual_activity: null }),
    }))
    await fetch('/api/plan/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: false, strava_activity: null, manual_activity: null }),
    })
    setDeleteConfirm(false)
    setSelectedSession(null)
  }

  const toggleCompleted = async (weekIndex, sessionIndex) => {
    const current = localSemaines[weekIndex].seances[sessionIndex].completed
    const updated = localSemaines.map((w, wi) =>
      wi !== weekIndex ? w : {
        ...w,
        seances: w.seances.map((s, si) => si !== sessionIndex ? s : { ...s, completed: !current }),
      }
    )
    setLocalSemaines(updated)
    await fetch('/api/plan/session', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, completed: !current }),
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f8' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1rem', height: '52px', display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <Link href="/dashboard?tab=plan" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #e8e8e8', background: 'white', textDecoration: 'none', flexShrink: 0 }}>
            <ChevronLeft size={15} color="#464754" />
          </Link>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
            <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#282830', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
              {plan.race_name || plan.distance}
            </span>
            {plan.race_name && <span style={{ fontSize: '0.75rem', color: '#b0b3c1', flexShrink: 0 }}>{plan.distance}</span>}
          </div>
          {raceDate && (
            <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#9ea0ae', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              <Flag size={12} strokeWidth={2} />
              Course prévue le {raceDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
          {weeksLeft !== null && weeksLeft > 0 && (
            <span style={{ fontSize: '0.72rem', fontWeight: '700', background: '#f0faf5', color: '#02A257', border: '1.5px solid #c5e6d5', borderRadius: '99px', padding: '0.15rem 0.55rem', flexShrink: 0 }}>
              J-{weeksLeft * 7}
            </span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setSelectedWeek(w => Math.max(0, w - 1))}
            disabled={selectedWeek === 0}
            style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e8e8e8', background: 'white', cursor: selectedWeek === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={15} color="#464754" />
          </button>
          <div ref={weekScrollRef} style={{ flex: 1, display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', justifyContent: totalWeeks <= 8 ? 'center' : 'flex-start' }}>
          {semaines.map((s, i) => {
            const totalSeances = s.seances?.length || 0
            const doneSeances = s.seances?.filter(se => se.completed || se.strava_activity || se.manual_activity).length || 0
            const allDone = doneSeances === totalSeances && totalSeances > 0
            const hasSome = doneSeances > 0
            const isSelected = i === selectedWeek
            const isCurrent = i === currentWeekIndex
            return (
              <button
                key={i}
                ref={el => weekPillRefs.current[i] = el}
                onClick={() => setSelectedWeek(i)}
                style={{
                  flexShrink: 0,
                  position: 'relative',
                  padding: '0.4rem 0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: '1.5px solid',
                  background: isSelected ? '#02A257' : 'white',
                  borderColor: isSelected ? '#02A257' : isCurrent ? '#02A257' : '#e8e8e8',
                  transition: 'all 0.15s',
                  overflow: 'hidden',
                }}
              >
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isSelected ? 'white' : isCurrent ? '#02A257' : '#282830' }}>
                  S{i + 1}
                </span>
                {allDone && !isSelected && (
                  <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', color: '#02A257' }}>✓</span>
                )}
                {hasSome && !allDone && !isSelected && (
                  <div style={{ position: 'absolute', bottom: 0, left: '10%', right: '10%', height: '2px', borderRadius: '99px', background: '#02A257', opacity: 0.5 }} />
                )}
              </button>
            )
          })}
          </div>
          <button
            onClick={() => setSelectedWeek(w => Math.min(totalWeeks - 1, w + 1))}
            disabled={selectedWeek === totalWeeks - 1}
            style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: '8px', border: '1.5px solid #e8e8e8', background: 'white', cursor: selectedWeek === totalWeeks - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: selectedWeek === totalWeeks - 1 ? 0.3 : 1 }}
          >
            <ChevronRight size={15} color="#464754" />
          </button>
        </div>

        {/* Session modal */}
        {selectedSession && (() => {
          const { weekIndex, sessionIndex } = selectedSession
          const s = localSemaines[weekIndex]?.seances?.[sessionIndex]
          if (!s) return null
          const colors = INTENSITE_COLORS[s.intensite] || INTENSITE_COLORS['modéré']
          const done = !!s.completed
          const { activity: strava, source: stravaSource } = getActivity(s, sessionIndex === 0 && weekIndex === 0 ? MOCK_STRAVA : null)
          return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1rem' }}
              onClick={() => { setSelectedSession(null); setDeleteConfirm(false) }}
            >
              <div style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(28,28,36,0.2)' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Modal header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <SessionShape type={s.type} size={32} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#282830' }}>{s.type}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9ea0ae', marginTop: '0.1rem' }}>{s.jour} · {getSessionDate(s.jour)}{s.moment ? ` · ${s.moment === 'matin' ? 'Matin' : 'Soir'}` : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '6px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{s.intensite}</span>
                    <button onClick={() => setSelectedSession(null)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={14} color="#9ea0ae" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#b0b3c1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
                    {s.type === 'Jour de repos' ? 'Repos' : `Séance ${sessionIndex + 1}`}
                  </div>
                  {s.description && <p style={{ fontSize: '0.9rem', color: '#464754', lineHeight: 1.55, marginBottom: '1rem' }}>{s.description}</p>}
                  {/* Stats prévues — masquées pour repos et renforcement sans distance */}
                  {s.type !== 'Jour de repos' && (s.distance_km > 0 || s.type === 'Renforcement musculaire') && (
                  <div style={{ display: 'grid', gridTemplateColumns: s.type === 'Renforcement musculaire' ? '1fr' : 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(s.type === 'Renforcement musculaire'
                      ? [{ label: 'Durée', value: `${s.duree_minutes} min` }]
                      : s.type === 'Sortie vélo'
                      ? [{ label: 'Durée', value: `${s.duree_minutes} min` }]
                      : [
                          { label: 'Distance', value: `${s.distance_km} km` },
                          { label: 'Durée', value: `${s.duree_minutes} min` },
                          { label: 'Allure cible', value: s.allure_cible || '—' },
                        ]
                    ).map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8f9fa', borderRadius: '10px', padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>{label}</div>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  )}
                  {(() => {
                    const coachText = buildCoachNarrative(s)
                    if (s.type === 'Fractionné') {
                      const blocks = parseIntervalBlocks(s.details)
                      const isOpen = !done && !strava
                      return (
                        <div style={{ marginBottom: '1.25rem' }}>
                          <CollapsibleInstructions text={buildIntervalNarrative(blocks)} defaultOpen={isOpen} />
                          {(!done && !strava) && (
                            <>
                              <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.65rem' }}>Programme</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                {blocks.map((b, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '16px', flexShrink: 0 }}>
                                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: b.color, flexShrink: 0, marginTop: '0.65rem', border: `2px solid ${b.border}` }} />
                                      {idx < blocks.length - 1 && (
                                        <div style={{ width: '2px', flex: 1, background: '#e8e8e8', minHeight: '12px', marginTop: '2px' }} />
                                      )}
                                    </div>
                                    <div style={{ flex: 1, padding: '0.5rem 0.75rem', marginBottom: idx < blocks.length - 1 ? '0.35rem' : 0, borderRadius: '10px', background: b.bg, border: `1px solid ${b.border}` }}>
                                      {b.label && (
                                        <div style={{ fontSize: '0.58rem', fontWeight: '700', color: b.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{b.label}</div>
                                      )}
                                      <div style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.45 }}>{b.text}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )
                    }
                    if (!coachText) return null
                    return <CollapsibleInstructions text={coachText} defaultOpen={!done && !strava} />

                  })()}
                  {/* Nutrition */}
                  {s.type !== 'Jour de repos' && <NutritionSection seance={s} hash={hashSession(s)} />}
                  {/* Notes */}
                  {s.type !== 'Jour de repos' && <NoteField
                    note={typeof s.note === 'string' && s.note !== '[object Object]' ? s.note : ''}
                    fatigue={s.fatigue || null}
                    onSave={async ({ note, fatigue }) => {
                      const semaines = [...localSemaines]
                      semaines[weekIndex].seances[sessionIndex].note = note
                      semaines[weekIndex].seances[sessionIndex].fatigue = fatigue
                      setLocalSemaines(semaines)
                      await fetch('/api/plan/session', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ plan_id: plan.id, week_index: weekIndex, session_index: sessionIndex, note, fatigue }),
                      })
                    }}
                  />}
                  {/* Mark as done */}
                  {s.type !== 'Jour de repos' && !strava ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        onClick={() => toggleCompleted(weekIndex, sessionIndex)}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '99px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s', background: done ? '#f0fdf4' : '#02A257', color: done ? '#16a34a' : 'white', border: `1.5px solid ${done ? '#bbf7d0' : '#02A257'}` }}
                      >
                        {done ? 'Réalisée — annuler' : 'Marquer comme réalisée'}
                      </button>
                    </div>
                  ) : null}
                  {/* Activity block */}
                  {strava && (
                    <div style={{ marginTop: '1rem', borderRadius: '14px', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}`, overflow: 'hidden' }}>
                      <div style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: stravaSource === 'strava' ? '#FC4C02' : '#02A257' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {stravaSource === 'strava' ? <StravaLogo size={16} /> : <CheckCircle2 size={16} color="white" />}
                          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'white' }}>{stravaSource === 'strava' ? 'Activité synchronisée' : 'Saisie manuelle'}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>{strava.nom}</span>
                      </div>
                      <div style={{ background: '#fafafa', padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {[
                            { label: 'Distance', prevu: `${s.distance_km} km`, reel: `${strava.distance_km} km`, better: strava.distance_km >= s.distance_km },
                            { label: 'Durée', prevu: `${s.duree_minutes} min`, reel: `${strava.duree_minutes} min`, better: strava.duree_minutes <= s.duree_minutes },
                            ...(strava.allure_moyenne ? [{ label: 'Allure moy.', prevu: s.allure_cible || '—', reel: fmtPaceMin(strava.allure_moyenne), better: null }] : []),
                            ...(strava.frequence_cardiaque_moy ? [{ label: 'FC moy.', prevu: '—', reel: `${strava.frequence_cardiaque_moy} bpm`, better: null }] : []),
                            ...(strava.denivele_positif ? [{ label: 'Dénivelé', prevu: '—', reel: `+${strava.denivele_positif} m`, better: null }] : []),
                            ...(strava.calories ? [{ label: 'Calories', prevu: '—', reel: `${strava.calories} kcal`, better: null }] : []),
                          ].map(({ label, prevu, reel, better }) => (
                            <div key={label} style={{ background: 'white', borderRadius: '10px', padding: '0.6rem 0.75rem', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}` }}>
                              <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>{label}</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: better === null ? '#282830' : better ? '#02A257' : '#dc2626' }}>{reel}</span>
                                {prevu !== '—' && <span style={{ fontSize: '0.7rem', color: '#b0b3c1' }}>/ {prevu} prévu</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        {strava.note && (
                          <div style={{ marginBottom: '0.75rem', padding: '0.6rem 0.75rem', borderRadius: '10px', background: 'white', border: `1px solid ${stravaSource === 'strava' ? '#fdd0b8' : '#c5e6d5'}` }}>
                            <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.3rem' }}>Note</div>
                            <div style={{ fontSize: '0.84rem', color: '#464754' }}>{strava.note}</div>
                          </div>
                        )}
                        {/* Supprimer l'activité */}
                        {!deleteConfirm ? (
                          <button
                            onClick={() => setDeleteConfirm(true)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '10px', border: '1px solid #fecaca', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', color: '#dc2626', marginBottom: stravaSource === 'strava' && strava.strava_id ? '0.75rem' : '0' }}
                          >
                            Supprimer l'activité
                          </button>
                        ) : (
                          <div style={{ marginBottom: stravaSource === 'strava' && strava.strava_id ? '0.75rem' : '0', padding: '0.75rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#dc2626', marginBottom: '0.5rem' }}>Supprimer cette activité ?</div>
                            <div style={{ fontSize: '0.75rem', color: '#9ea0ae', marginBottom: '0.65rem' }}>La séance repassera en "non réalisée".</div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button onClick={() => setDeleteConfirm(false)} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '500', color: '#656779' }}>Annuler</button>
                              <button onClick={() => deleteActivity(weekIndex, sessionIndex)} style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: 'none', background: '#dc2626', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: 'white' }}>Confirmer</button>
                            </div>
                          </div>
                        )}
                        {stravaSource === 'strava' && strava.strava_id && (
                          <a href={`https://www.strava.com/activities/${strava.strava_id}`} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#FC4C02', fontWeight: '600', textDecoration: 'none' }}>
                            <StravaLogo size={12} /> Voir sur Strava →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Week detail */}
        <div style={{ ...T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: "1px solid #f0f0f0", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', ...T.primary }}>{semaine.theme}</div>
              <div style={{ fontSize: '0.75rem', ...T.faint, marginTop: '0.2rem' }}>{fmtDay(weekMonday)} → {fmtDay(weekSunday)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', ...T.green, fontSize: '1.1rem' }}>{(semaine.seances || []).reduce((sum, s) => sum + (s.distance_km || 0), 0)} km</div>
              <div style={{ fontSize: '0.75rem', ...T.faint }}>{semaine.seances?.length} séances</div>
            </div>
          </div>

          {/* Stats rapides */}
          {(() => {
            const seances = semaine.seances || []
            const withActivity = seances.map((se, i) => {
              const { activity } = getActivity(se, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
              return { ...se, _activity: activity }
            })
            const done = withActivity.filter(se => se.completed || se._activity)
            if (done.length === 0) return null
            const kmPrevus = seances.reduce((sum, se) => sum + (se.distance_km || 0), 0)
            const kmRealises = done.reduce((sum, se) => { const km = se._activity?.distance_km ?? se.distance_km ?? 0; return sum + km }, 0)
            const minRealises = done.reduce((sum, se) => sum + (se._activity?.duree_minutes ?? se.duree_minutes ?? 0), 0)
            const h = Math.floor(minRealises / 60)
            const m = minRealises % 60
            const dureeStr = h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
            const allDone = done.length === seances.length
            return (
              <div style={{ padding: '1rem 1.5rem', background: 'white', borderBottom: '1px solid #f0f0f0' }}>
                {allDone && (
                  <div style={{ textAlign: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.4rem' }}><CheckCircle2 size={28} color="#02A257" /></div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#02A257', marginBottom: '0.5rem' }}>Semaine {selectedWeek + 1} complète !</div>
                    {(() => {
                      const kmRnd = done.reduce((s, se) => s + (se._activity?.distance_km ?? se.distance_km ?? 0), 0).toFixed(1)
                      const minTot = done.reduce((s, se) => s + (se._activity?.duree_minutes ?? se.duree_minutes ?? 0), 0)
                      const h = Math.floor(minTot / 60), m = minTot % 60
                      const duree = h > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${m} min`
                      return (
                        <div style={{ marginTop: '0.5rem', padding: '0.85rem 1.1rem', borderRadius: '12px', background: '#f7f7f8', borderLeft: '3px solid #02A257' }}>
                          <div style={{ fontSize: '0.82rem', color: '#464754', lineHeight: 1.65, textAlign: 'left' }}>
                            <strong style={{ color: '#282830' }}>{done.length} séances</strong> bouclées, <strong style={{ color: '#282830' }}>{kmRnd} km</strong> au compteur et <strong style={{ color: '#282830' }}>{duree}</strong> sur les jambes. Belle semaine, continue comme ça !
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <div style={{ background: '#f7f7f8', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Séances</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#282830' }}>{done.length}<span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#9ea0ae' }}>/{seances.length}</span></div>
                  </div>
                  <div style={{ background: '#f0faf5', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Distance</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#02A257' }}>{kmRealises.toFixed(1)}<span style={{ fontSize: '0.72rem', fontWeight: '500', color: '#9ea0ae' }}> km</span></div>
                  </div>
                  <div style={{ background: '#f7f7f8', borderRadius: '12px', padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>Durée</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#282830' }}>{dureeStr}</div>
                  </div>
                </div>

              </div>
            )
          })()}

          {/* Sessions */}
          <div>
            {(semaine.seances || []).map((seance, i) => {
              const colors = INTENSITE_COLORS[seance.intensite] || INTENSITE_COLORS['modéré']
              const done = !!seance.completed
              const { activity: strava, source: stravaSource } = getActivity(seance, i === 0 && selectedWeek === 0 ? MOCK_STRAVA : null)
              const actColor = stravaSource === 'strava' ? '#FC4C02' : '#02A257'
              return (
                <div
                  key={i}
                  onClick={() => setSelectedSession({ weekIndex: selectedWeek, sessionIndex: i, seance })}
                  style={{ padding: '1rem 1.5rem', borderBottom: i < semaine.seances.length - 1 ? '1px solid #f5f5f5' : 'none', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', background: 'white', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fafafa' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
                >
                  <div style={{ flexShrink: 0, width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SessionShape type={seance.type} size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                      {seance.jour?.slice(0, 3)} · {getSessionDate(seance.jour)}{seance.moment ? ` · ${seance.moment === 'matin' ? 'Matin' : 'Soir'}` : ''}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: (strava || done) ? '#b0b3c1' : '#282830' }}>{seance.type}</span>
                      {stravaSource === 'strava' && <StravaLogo size={12} />}
                      {stravaSource === 'manual' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                        </svg>
                      )}
                      {done && !strava && <CheckCircle2 size={12} color="#16a34a" />}
                      {!(strava || done) && (
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.5rem', borderRadius: '99px', background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}>{seance.intensite}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {(strava || done) ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', padding: '0.25rem 0.65rem', borderRadius: '99px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                        <CheckCircle2 size={11} /> Réalisée
                      </span>
                    ) : (
                      <>
                        <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830' }}>{seance.distance_km} km</div>
                        {seance.allure_cible && ['Footing léger', 'Récupération active'].includes(seance.type) && <div style={{ fontSize: '0.75rem', ...T.green, fontWeight: '600' }}>{seance.allure_cible}</div>}
                        {seance.duree_minutes && <div style={{ fontSize: '0.72rem', ...T.faint }}>{seance.duree_minutes >= 60 ? `${Math.floor(seance.duree_minutes / 60)}h${String(seance.duree_minutes % 60).padStart(2, '0')}` : `${seance.duree_minutes} min`}</div>}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Ajouter une activité */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => { setAddOpen(o => !o); setAddSuccess(false); setAddError(null) }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', borderRadius: '99px', border: "1px solid #e8e8e8", background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#656779' }}
          >
            <span style={{ fontSize: '1rem', lineHeight: 1, color: '#02A257' }}>+</span>
            Ajouter une activité
          </button>
        </div>

        {addOpen && (
          <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(28,28,36,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(2px)', padding: '1rem' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', width: '100%', maxWidth: '420px', padding: '1.5rem', boxShadow: '0 8px 40px rgba(28,28,36,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#282830' }}>Ajouter une activité</div>
                <button onClick={() => setAddOpen(false)} style={{ border: 'none', background: '#f5f5f5', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#9ea0ae" />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Date</label>
                  <input type="date" value={addForm.date} max={new Date().toISOString().split('T')[0]} onChange={e => { setAddError(null); setAddForm(f => ({ ...f, date: e.target.value })) }}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Type</label>
                  <select value={addForm.type_activite} onChange={e => setAddForm(f => ({ ...f, type_activite: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }}>
                    {[['Run','🏃 Course'],['Ride','🚴 Vélo'],['Walk','🚶 Marche / Randonnée'],['Swim','🏊 Natation'],['WeightTraining','💪 Renforcement'],['Workout','💪 Workout'],['Yoga','🧘 Yoga'],['Rowing','🚣 Aviron']].map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Distance (km)</label>
                  <input type="number" min="0" step="0.1" placeholder="ex: 8.5" value={addForm.distance_km} onChange={e => setAddForm(f => ({ ...f, distance_km: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Durée (min)</label>
                  <input type="number" min="0" placeholder="ex: 45" value={addForm.duree_minutes} onChange={e => setAddForm(f => ({ ...f, duree_minutes: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Allure (min/km)</label>
                  <input type="number" min="0" step="0.01" placeholder="ex: 5.30" value={addForm.allure_moyenne} onChange={e => setAddForm(f => ({ ...f, allure_moyenne: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>FC moy. (bpm)</label>
                  <input type="number" min="0" placeholder="ex: 155" value={addForm.frequence_cardiaque_moy} onChange={e => setAddForm(f => ({ ...f, frequence_cardiaque_moy: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Dénivelé (m)</label>
                  <input type="number" min="0" placeholder="ex: 250" value={addForm.denivele_positif} onChange={e => setAddForm(f => ({ ...f, denivele_positif: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Calories (kcal)</label>
                  <input type="number" min="0" placeholder="ex: 480" value={addForm.calories} onChange={e => setAddForm(f => ({ ...f, calories: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ ...T.label, display: 'block', marginBottom: '0.3rem' }}>Note</label>
                  <input type="text" placeholder="ex: Sortie cool" value={addForm.note} onChange={e => setAddForm(f => ({ ...f, note: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '8px', border: "1px solid #e8e8e8", fontSize: '0.85rem', color: '#282830', background: 'white', boxSizing: 'border-box' }} />
                </div>
              </div>
              {addError && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '0.82rem', color: '#dc2626', fontWeight: '500' }}>
                  {addError}
                </div>
              )}
              <button
                onClick={handleAddActivity}
                disabled={addLoading || addSuccess || (!addForm.distance_km && !addForm.duree_minutes)}
                style={{ marginTop: '1rem', width: '100%', padding: '0.75rem', borderRadius: '12px', border: 'none', cursor: addLoading || addSuccess ? 'default' : 'pointer', fontWeight: '600', fontSize: '0.88rem', transition: 'all 0.15s', background: addSuccess ? '#f0fdf4' : '#02A257', color: addSuccess ? '#16a34a' : 'white', opacity: (!addForm.distance_km && !addForm.duree_minutes) ? 0.5 : 1 }}>
                {addSuccess ? '✓ Activité enregistrée !' : addLoading ? 'Enregistrement...' : "Enregistrer l'activité"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

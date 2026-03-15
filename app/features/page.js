import Link from 'next/link'

const FEATURES = [
  {
    category: 'Plans d\'entraînement',
    items: [
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        ),
        title: 'Plan 100% personnalisé',
        desc: 'Généré en 2 minutes selon ton niveau, ton volume hebdo, tes jours dispo et ta course cible. Pas un plan générique — le tien.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
          </svg>
        ),
        title: '4 distances couvertes',
        desc: '5K, 10K, Semi-Marathon et Marathon. Chaque distance a son propre programme de progression, avec des durées adaptées (6 à 18 semaines).',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        ),
        title: 'Progression intelligente',
        desc: 'Le volume augmente semaine après semaine selon la méthode 80/20 : 80% d\'endurance, 20% de qualité. Avec des semaines de récupération automatiques.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
          </svg>
        ),
        title: 'Phases structurées',
        desc: 'Fondation → Développement → Affûtage → Course. Chaque phase a ses séances spécifiques pour arriver au départ en pleine forme.',
      },
    ],
  },
  {
    category: 'Types de séances',
    items: [
      {
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#02A257', display: 'inline-block' }} />,
        title: 'Footing léger & Récupération',
        desc: 'La base de tout bon plan. Zone 2, allure conversationnelle, pour construire ton endurance sans te cramer.',
      },
      {
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />,
        title: 'Fractionné & Allure spécifique',
        desc: 'Intervalles VMA, blocs à allure cible — pour gagner en vitesse et en résistance aux moments clés du plan.',
      },
      {
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />,
        title: 'Sortie longue',
        desc: 'La séance reine du runner. Progressivement allongée chaque semaine pour préparer ton corps aux longues distances.',
      },
      {
        icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0891b2', display: 'inline-block' }} />,
        title: 'Cross-training intégré',
        desc: 'Renforcement musculaire, sortie vélo et jour de repos planifiés automatiquement pour équilibrer la charge et prévenir les blessures.',
      },
    ],
  },
  {
    category: 'Suivi & Coaching',
    items: [
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        ),
        title: 'Instructions de coach',
        desc: 'Chaque séance a ses consignes détaillées : allure, durée, récupération. Plusieurs variantes pour éviter la répétition.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        ),
        title: 'Indice de confiance',
        desc: 'Un score calculé en temps réel selon ton historique, tes temps de référence et ton objectif. Pour savoir si ton plan est réaliste ou ambitieux.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        ),
        title: 'Suivi des séances',
        desc: 'Marque tes séances comme réalisées, ajoute ton ressenti et ta fatigue. L\'historique reste accessible semaine par semaine.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
        ),
        title: 'Connexion Strava',
        desc: 'Connecte ton compte Strava pour importer automatiquement tes activités et les matcher avec tes séances prévues.',
      },
    ],
  },
  {
    category: 'Nutrition & Préparation',
    items: [
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        ),
        title: 'Conseils nutrition par séance',
        desc: 'Avant, pendant, après — chaque type de séance a ses recommandations nutrition et hydratation adaptées à l\'effort.',
      },
      {
        icon: (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02A257" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
          </svg>
        ),
        title: 'Profil avancé +VITE',
        desc: 'Renseigne ta FC max, ta FC de repos, ton FTP vélo, ta morphologie — pour des recommandations encore plus précises.',
      },
    ],
  },
]

export default function Features() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0faf5', fontFamily: 'system-ui, sans-serif' }}>

      {/* Nav */}
      <nav style={{ background: 'white', borderBottom: '1px solid #c5e6d5' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ color: '#02A257', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.03em' }}>VITE</span>
          </Link>
          <Link href="/onboarding" style={{ background: '#02A257', color: 'white', padding: '0.45rem 1rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700' }}>
            Créer mon plan →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '3rem 1.25rem 1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: '700', padding: '0.3rem 0.75rem', borderRadius: '99px', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          ✦ Beta
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#282830', lineHeight: 1.2, marginBottom: '0.75rem' }}>
          Ce que VITE<br/>sait faire
        </h1>
        <p style={{ fontSize: '1rem', color: '#656779', lineHeight: 1.65, maxWidth: '480px' }}>
          Un coach de poche pour runners sérieux. Voici tout ce que l'app fait pour toi dès aujourd'hui.
        </p>
      </div>

      {/* Features */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 1.25rem 4rem' }}>
        {FEATURES.map(section => (
          <div key={section.category} style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {section.items.map(f => (
                <div key={f.title} style={{ background: 'white', border: '1px solid #c5e6d5', borderRadius: '14px', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830', marginBottom: '0.25rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#9ea0ae', lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA final */}
        <div style={{ background: '#02A257', borderRadius: '20px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem' }}>Prêt à commencer ?</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', marginBottom: '1.25rem' }}>Génère ton plan en 2 minutes. Gratuit, sans compte requis.</div>
          <Link href="/onboarding" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'white', color: '#02A257', padding: '0.75rem 1.5rem', borderRadius: '12px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '800' }}>
            Créer mon plan gratuit →
          </Link>
        </div>
      </div>

    </div>
  )
}

'use client'
import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'

const FAQ = [
  {
    category: 'Démarrer',
    items: [
      { q: "C'est gratuit ?", a: "Oui, 100% gratuit. Pas de carte bleue, pas de compte requis." },
      { q: "Faut-il un compte Strava ?", a: "Non. Strava est optionnel — il permet d'importer tes activités automatiquement, mais tu peux utiliser VITE sans." },
      { q: "En combien de temps je génère un plan ?", a: "2 minutes. Tu réponds à quelques questions sur ton niveau, tes dispo et ta course cible — le plan est généré instantanément." },
    ],
  },
  {
    category: 'Mon plan',
    items: [
      { q: "Comment fonctionne la progression ?", a: "Le volume augmente semaine après semaine. Une semaine de récupération est automatiquement insérée toutes les 4 semaines." },
      { q: "C'est quoi l'indice de confiance ?", a: "Un score qui évalue si ton objectif est réaliste selon ton niveau. Vert = réaliste, orange = ambitieux, rouge = risqué." },
      { q: "Puis-je avoir plusieurs plans ?", a: "Oui. Tu peux créer autant de plans que tu veux et basculer entre eux depuis l'onglet Plan." },
    ],
  },
  {
    category: 'Séances',
    items: [
      { q: "Comment marquer une séance comme réalisée ?", a: "Ouvre la séance et appuie sur le bouton vert en bas. Si Strava est connecté, c'est automatique." },
      { q: "Que faire si je rate une séance ?", a: "Pas de panique — passe simplement à la suivante. Le plan reste valide." },
      { q: "C'est quoi les séances Renforcement et Vélo ?", a: "Du cross-training intégré pour équilibrer la charge et prévenir les blessures. Disponible sur les plans intermédiaires et avancés." },
    ],
  },
]

function Item({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div onClick={() => setOpen(o => !o)} style={{ borderBottom: '1px solid #f0f0f0', padding: '1rem 0', cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#282830' }}>{q}</span>
        <span style={{ flexShrink: 0, color: '#9ea0ae', fontSize: '1rem', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
      </div>
      {open && <p style={{ margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#656779', lineHeight: 1.65 }}>{a}</p>}
    </div>
  )
}

export default function Help() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0faf5', fontFamily: 'system-ui, sans-serif' }}>
      <Script src="https://tally.so/widgets/embed.js" strategy="lazyOnload" />
      <nav style={{ background: 'white', borderBottom: '1px solid #c5e6d5' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 1.25rem', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#02A257', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-0.03em' }}>VITE</Link>
          <Link href="/onboarding" style={{ background: '#02A257', color: 'white', padding: '0.45rem 1rem', borderRadius: '10px', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700' }}>
            Créer mon plan →
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#282830', marginBottom: '0.4rem' }}>Aide</h1>
        <p style={{ fontSize: '0.85rem', color: '#9ea0ae', marginBottom: '2rem' }}>Les réponses aux questions les plus fréquentes.</p>

        {FAQ.map(section => (
          <div key={section.category} style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
              {section.category}
            </div>
            {section.items.map(item => <Item key={item.q} q={item.q} a={item.a} />)}
          </div>
        ))}

        <div style={{ marginTop: '2.5rem', background: 'white', border: '1px solid #c5e6d5', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#282830', marginBottom: '0.3rem' }}>Une autre question ?</div>
          <div style={{ fontSize: '0.8rem', color: '#9ea0ae', marginBottom: '0.75rem' }}>On est là pour t&apos;aider.</div>
          <button onClick={() => window.Tally?.openPopup('5B2X2Z', { layout: 'modal', width: 600, autoClose: 3000 })} style={{ background: '#02A257', color: 'white', border: 'none', padding: '0.55rem 1.1rem', borderRadius: '10px', fontSize: '0.82rem', fontWeight: '700', cursor: 'pointer' }}>
            Envoyer un message →
          </button>
        </div>
      </div>
    </div>
  )
}

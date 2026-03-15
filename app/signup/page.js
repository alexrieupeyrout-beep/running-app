'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const inputStyle = {
  width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px',
  border: '1.5px solid #e8e8e8', fontSize: '0.88rem', color: '#c0c2cc',
  background: '#f7f7f8', boxSizing: 'border-box', outline: 'none', cursor: 'not-allowed',
}

const labelStyle = {
  display: 'block', fontSize: '0.7rem', fontWeight: '600',
  color: '#c0c2cc', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem',
}

export default function Signup() {
  return (
    <div className="min-h-screen bg-[#f0faf5] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#c5e6d5]">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6" style={{ height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="text-[#02A257] font-black text-2xl tracking-tight">VITE</span>
          </Link>
          <Link href="/features" style={{ fontSize: '0.82rem', fontWeight: '600', color: '#02A257', textDecoration: 'none' }}>
            Ce que VITE sait faire →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm flex flex-col gap-5">

          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-md border border-[#c5e6d5]">
                <svg width="42" height="42" viewBox="0 0 52 52" fill="none">
                  <rect x="4" y="14" width="44" height="24" rx="12" stroke="#02A257" strokeWidth="5" fill="none"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#282830] mb-2">Rejoins VITE</h1>
            <p className="text-[#9ea0ae] text-sm leading-relaxed">
              Génère ton plan d'entraînement personnalisé.
            </p>
          </div>

          {/* CTA principal */}
          <Link
            href="/onboarding"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: '0.9rem', borderRadius: '14px', background: '#02A257',
              color: 'white', fontWeight: '700', fontSize: '0.9rem',
              textDecoration: 'none', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#019048'}
            onMouseLeave={e => e.currentTarget.style.background = '#02A257'}
          >
            Continuer sans compte
            <ArrowRight size={15} />
          </Link>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
            <span style={{ fontSize: '0.72rem', color: '#c0c2cc', fontWeight: '500' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: '#e8e8e8' }} />
          </div>

          {/* Tab switcher grisé */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', background: 'white', border: '1.5px solid #e8e8e8', borderRadius: '12px', padding: '4px', opacity: 0.45, pointerEvents: 'none' }}>
              {['Créer un compte', 'Se connecter'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    flex: 1, padding: '0.5rem', borderRadius: '9px', textAlign: 'center',
                    fontSize: '0.82rem', fontWeight: '600',
                    background: i === 0 ? '#e8e8e8' : 'transparent',
                    color: '#b0b3c1',
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Card grisée */}
            <div style={{ marginTop: '0.75rem', background: 'white', border: '1.5px solid #e8e8e8', borderRadius: '20px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', opacity: 0.45, pointerEvents: 'none' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" placeholder="ton@email.com" disabled style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mot de passe</label>
                <input type="password" placeholder="••••••••" disabled style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmer le mot de passe</label>
                <input type="password" placeholder="••••••••" disabled style={inputStyle} />
              </div>
              <div style={{ padding: '0.85rem', borderRadius: '12px', background: '#e8e8e8', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem', color: '#b0b3c1' }}>
                Créer mon compte
              </div>
            </div>

            {/* Badge bientôt dispo */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', border: '1.5px solid #e8e8e8', borderRadius: '99px', padding: '0.4rem 1rem', fontSize: '0.75rem', fontWeight: '600', color: '#9ea0ae', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', whiteSpace: 'nowrap' }}>
              Bientôt disponible
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

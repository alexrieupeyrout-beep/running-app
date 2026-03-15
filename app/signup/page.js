'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
    })
  }, [])

  async function handlePin(e) {
    e.preventDefault()
    setPinError('')
    const res = await fetch('/api/auth/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    if (res.ok) {
      localStorage.setItem('pin_authed', '1')
      router.replace('/dashboard')
    } else {
      setPinError('Code incorrect')
    }
  }

  async function handleMagicLink(e) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (error) {
      setError('Une erreur est survenue. Vérifie ton adresse email.')
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f0faf5] flex flex-col">
      {/* Nav */}
      <nav className="bg-white border-b border-[#c5e6d5]">
        <div className="max-w-2xl mx-auto w-full px-4 sm:px-6" style={{ height: '52px', display: 'flex', alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span className="text-[#02A257] font-black text-2xl tracking-tight">VITE</span>
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

          {/* CTA sans compte */}
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

          {/* Formulaire magic link */}
          {sent ? (
            <div style={{
              background: 'white', border: '1.5px solid #c5e6d5', borderRadius: '20px',
              padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.75rem', textAlign: 'center',
            }}>
              <CheckCircle size={36} color="#02A257" strokeWidth={1.75} />
              <div>
                <p style={{ fontWeight: '700', fontSize: '0.95rem', color: '#282830', marginBottom: '0.35rem' }}>
                  Vérifie ta boîte mail
                </p>
                <p style={{ fontSize: '0.82rem', color: '#9ea0ae', lineHeight: '1.5' }}>
                  On a envoyé un lien de connexion à <strong style={{ color: '#282830' }}>{email}</strong>.<br />
                  Clique dessus pour accéder à ton espace.
                </p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                style={{ fontSize: '0.78rem', color: '#02A257', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.25rem' }}
              >
                Utiliser une autre adresse
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} style={{
              background: 'white', border: '1.5px solid #e8e8e8', borderRadius: '20px',
              padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '600', color: '#9ea0ae', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.35rem' }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '0.6rem 0.85rem', borderRadius: '10px',
                    border: '1.5px solid #e8e8e8', fontSize: '0.88rem', color: '#282830',
                    background: '#f7f7f8', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: '0.78rem', color: '#e53e3e', margin: 0 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.85rem', borderRadius: '12px',
                  background: loading || !email ? '#c5e6d5' : '#02A257',
                  color: 'white', fontWeight: '700', fontSize: '0.88rem',
                  border: 'none', cursor: loading || !email ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <Mail size={15} />
                {loading ? 'Envoi en cours…' : 'Recevoir mon lien de connexion'}
              </button>

              <p style={{ fontSize: '0.72rem', color: '#c0c2cc', textAlign: 'center', margin: 0 }}>
                Pas de mot de passe. Un lien suffit.
              </p>
            </form>
          )}

        </div>

        {/* Accès rapide PIN — discret */}
        <form onSubmit={handlePin} style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="password"
            placeholder="••••"
            value={pin}
            onChange={e => setPin(e.target.value)}
            style={{
              width: '80px', padding: '0.4rem 0.6rem', borderRadius: '8px', textAlign: 'center',
              border: '1px solid #e8e8e8', fontSize: '0.8rem', color: '#9ea0ae',
              background: 'transparent', outline: 'none', letterSpacing: '0.2em',
            }}
          />
          {pinError && <span style={{ fontSize: '0.7rem', color: '#e53e3e' }}>{pinError}</span>}
        </form>

      </div>
    </div>
  )
}

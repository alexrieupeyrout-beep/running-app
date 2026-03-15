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
      setError(error.message)
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
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm flex flex-col gap-5">

          {/* Header */}
          <div className="text-center" style={{ position: 'relative' }}>
            {/* Cercle décoratif flou */}
            <div style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', borderRadius: '50%', background: '#02A257', opacity: 0.06, filter: 'blur(40px)', pointerEvents: 'none' }} />
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-lg border border-[#c5e6d5]">
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <rect x="4" y="14" width="44" height="24" rx="12" stroke="#02A257" strokeWidth="5" fill="none"/>
                </svg>
              </div>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#282830', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
              Rejoins <span style={{ color: '#02A257' }}>VITE</span>
            </h1>
            <p style={{ color: '#9ea0ae', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
              Ton prochain objectif mérite un vrai plan.<br/>
              <strong style={{ color: '#282830' }}>Analyse, progresse, performe.</strong>
            </p>
          </div>

          {/* Formulaire magic link */}
          {sent ? (
            <div style={{
              background: 'white', border: '1.5px solid #c5e6d5', borderRadius: '20px',
              overflow: 'hidden', textAlign: 'center',
            }}>
              {/* Bandeau vert */}
              <div style={{ background: 'linear-gradient(135deg, #02A257, #019048)', padding: '1.75rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle size={40} color="white" strokeWidth={1.75} />
                <p style={{ fontWeight: '800', fontSize: '1.05rem', color: 'white', margin: 0 }}>
                  Lien envoyé ! 🏃
                </p>
              </div>
              {/* Corps */}
              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: '#282830', fontWeight: '600', marginBottom: '0.4rem' }}>
                  Vérifie ta boîte mail
                </p>
                <p style={{ fontSize: '0.8rem', color: '#9ea0ae', lineHeight: '1.6', marginBottom: '1rem' }}>
                  On a envoyé un lien de connexion à<br/>
                  <strong style={{ color: '#282830' }}>{email}</strong>
                </p>
                <div style={{ background: '#f0faf5', borderRadius: '12px', padding: '0.75rem', fontSize: '0.75rem', color: '#02A257', fontWeight: '500', marginBottom: '1.25rem' }}>
                  ⚡ Valable 1 heure — ne traîne pas !
                </div>
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{ fontSize: '0.78rem', color: '#9ea0ae', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Utiliser une autre adresse
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} style={{
              background: 'white', border: '1.5px solid #e8e8e8', borderRadius: '24px',
              padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
              boxShadow: '0 4px 24px rgba(2, 162, 87, 0.08)',
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
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.95rem', borderRadius: '14px',
                  background: loading ? '#c5e6d5' : '#02A257',
                  color: 'white', fontWeight: '800', fontSize: '0.92rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s', letterSpacing: '-0.01em',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(2,162,87,0.35)',
                }}
              >
                <Mail size={15} />
                {loading ? 'Envoi en cours…' : 'Recevoir mon lien de connexion'}
              </button>

              <p style={{ fontSize: '0.78rem', color: '#02A257', textAlign: 'center', margin: 0, fontWeight: '600' }}>
                ✦ Pas de mot de passe. Un lien suffit.
              </p>
            </form>
          )}

          {/* Lien sans compte */}
          <button
            onClick={() => { localStorage.setItem('guest', '1'); router.push('/dashboard') }}
            style={{
              textAlign: 'center', fontSize: '0.8rem', color: '#c0c2cc',
              background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500',
            }}
          >
            Continuer sans compte
          </button>

          {/* Accès rapide PIN — discret */}
          <form onSubmit={handlePin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', borderTop: '1px solid #f0f0f0', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.65rem', color: '#d1d5db', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Accès admin</label>
            <input
              type="password"
              placeholder="Code"
              value={pin}
              onChange={e => setPin(e.target.value)}
              style={{
                width: '90px', padding: '0.45rem 0.75rem', borderRadius: '8px', textAlign: 'center',
                border: '1px solid #e8e8e8', fontSize: '0.85rem', color: '#9ea0ae',
                background: '#fafafa', outline: 'none', letterSpacing: '0.15em',
              }}
            />
            {pinError && <span style={{ fontSize: '0.7rem', color: '#e53e3e' }}>{pinError}</span>}
          </form>

        </div>

      </div>
    </div>
  )
}

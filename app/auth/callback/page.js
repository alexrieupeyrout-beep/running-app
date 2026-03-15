'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('exchangeCodeForSession error:', error.message)
          router.replace('/signup?error=' + encodeURIComponent(error.message))
        } else {
          router.replace('/dashboard')
        }
      })
    } else {
      // Supabase implicit flow : session dans le hash
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard')
        } else {
          router.replace('/signup')
        }
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f0faf5] flex items-center justify-center">
      <div style={{ textAlign: 'center', color: '#9ea0ae', fontSize: '0.9rem' }}>
        Connexion en cours…
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  )
}

import Link from 'next/link'

export default function Connect() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8 text-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-black tracking-tight text-[#02A257] hover:opacity-75 transition-opacity">
          VITE
        </Link>

        {/* Card */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FC4C02] flex items-center justify-center">
            <StravaIcon />
          </div>

          <div>
            <h1 className="text-xl font-semibold mb-2">Connecter Strava</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Autorisez l'accès à vos activités pour commencer à analyser vos courses.
            </p>
          </div>

          <a
            href="/api/auth/strava"
            className="w-full flex items-center justify-center gap-2.5 bg-[#FC4C02] hover:bg-[#e04400] text-white font-semibold py-3.5 rounded-2xl text-sm transition-colors"
          >
            <StravaIcon />
            Se connecter avec Strava
          </a>

          <p className="text-zinc-600 text-xs">
            Vos données restent privées et ne sont jamais partagées.
          </p>
        </div>

        <Link href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
          ← Retour
        </Link>
      </div>
    </div>
  )
}

function StravaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
    </svg>
  )
}

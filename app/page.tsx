import Link from "next/link";
import Image from "next/image";
import { Crosshair, Activity, RefreshCw, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Crosshair,
    title: "Plan personnalisé",
    desc: "Généré par IA selon ton niveau, ta course cible et tes disponibilités.",
  },
  {
    icon: Activity,
    title: "Suivi en temps réel",
    desc: "Tes séances sont automatiquement validées dès que tu cours.",
  },
  {
    icon: RefreshCw,
    title: "Plan adaptatif",
    desc: "Le plan se recalibre selon tes performances et séances réalisées.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-[#c5e6d5]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="VITE" width={30} height={30} className="rounded-xl" />
            <span className="text-[#02A257] font-black text-xl tracking-tight">VITE</span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-[#656779] hover:text-[#282830] transition-colors font-medium"
          >
            Mon dashboard <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#02A257] opacity-[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#ff9359] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">

          <h1 className="text-5xl sm:text-6xl font-bold text-[#282830] tracking-tight leading-tight max-w-2xl">
            Prépare ta prochaine{" "}
            <span className="text-[#02A257]">course.</span>
          </h1>

          <p className="text-[#656779] text-lg max-w-md leading-relaxed">
            VITE génère un plan d'entraînement personnalisé selon ton niveau,
            ton objectif et ta disponibilité — et s'adapte au fil de tes séances.
          </p>

          <Link
            href="/onboarding"
            className="mt-2 inline-flex items-center gap-2 bg-[#02A257] hover:bg-[#018f4c] text-white font-semibold px-7 py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            Créer mon plan d'entraînement
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-[#c5e6d5] rounded-2xl p-6 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#02A257]/8 flex items-center justify-center mb-4">
                <f.icon size={18} className="text-[#02A257]" strokeWidth={1.75} />
              </div>
              <div className="font-semibold text-[#282830] text-sm mb-1.5">{f.title}</div>
              <div className="text-[#656779] text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#c5e6d5] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-[#9ea0ae] text-xs">
          VITE · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Crosshair, Activity, RefreshCw, ArrowRight, CheckCircle2, Circle, ChevronDown } from "lucide-react";

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

const sessions = [
  { type: "Footing léger", jour: "Lun", km: "8 km", dur: "48 min", done: true },
  { type: "Fractionné", jour: "Mer", km: "10 km", dur: "1h05", done: true },
  { type: "Sortie longue", jour: "Sam", km: "22 km", dur: "2h10", done: false },
];

function SessionIcon({ type }: { type: string }) {
  const color =
    type === "Footing léger" ? "#02A257" :
    type === "Fractionné" ? "#dc2626" : "#2563eb";
  const s = 20, sw = 2.5;
  if (type === "Footing léger")
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="10" stroke={color} strokeWidth={sw} /></svg>;
  if (type === "Fractionné")
    return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><polyline points="17,3 10,15 15,15 11,25" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></svg>;
  return <svg width={s} height={s} viewBox="0 0 28 28" fill="none"><ellipse cx="14" cy="14" rx="12" ry="7" stroke={color} strokeWidth={sw} /></svg>;
}

function PlanPreviewCard() {
  return (
    <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e8e8e8", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", width: "100%", maxWidth: "340px" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#282830" }}>Semaine 4 — Endurance</div>
          <div style={{ fontSize: "0.7rem", color: "#9ea0ae", marginTop: "0.15rem" }}>10 mar → 16 mar</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", color: "#02A257" }}>40 km</div>
          <div style={{ fontSize: "0.7rem", color: "#9ea0ae" }}>3 séances</div>
        </div>
      </div>
      {/* Sessions */}
      {sessions.map((s, i) => (
        <div key={i} style={{ padding: "0.85rem 1.25rem", borderBottom: i < sessions.length - 1 ? "1px solid #f5f5f5" : "none", display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <SessionIcon type={s.type} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.65rem", color: "#b0b3c1", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>{s.jour}</div>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: s.done ? "#b0b3c1" : "#282830" }}>{s.type}</div>
          </div>
          {s.done ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", fontWeight: 600, padding: "0.2rem 0.6rem", borderRadius: "99px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", whiteSpace: "nowrap" }}>
              <CheckCircle2 size={10} /> Réalisée
            </span>
          ) : (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#282830" }}>{s.km}</div>
              <div style={{ fontSize: "0.7rem", color: "#9ea0ae" }}>{s.dur}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StatsPreviewCard() {
  const weeks = [30, 38, 35, 40, 28, 44, 42];
  const max = Math.max(...weeks);
  return (
    <div style={{ background: "white", borderRadius: "20px", border: "1px solid #e8e8e8", padding: "1.25rem", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", width: "100%", maxWidth: "280px" }}>
      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#9ea0ae", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem" }}>Volume hebdo (km)</div>
      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px", marginBottom: "0.5rem" }}>
        {weeks.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%", justifyContent: "flex-end" }}>
            <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === weeks.length - 1 ? "#02A257" : "#e8f5ee", height: `${(v / max) * 72}px`, transition: "height 0.3s" }} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
        {["L1","L2","L3","L4","L5","L6","L7"].map(l => (
          <div key={l} style={{ flex: 1, textAlign: "center", fontSize: "0.58rem", color: "#c0c2cc", fontWeight: 500 }}>{l}</div>
        ))}
      </div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        {[
          { label: "Cette sem.", value: "42 km" },
          { label: "Séances", value: "3/3" },
          { label: "Durée", value: "4h20" },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "#f7f7f8", borderRadius: "10px", padding: "0.5rem 0.4rem", textAlign: "center" }}>
            <div style={{ fontSize: "0.55rem", fontWeight: 600, color: "#b0b3c1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>{label}</div>
            <div style={{ fontWeight: 800, fontSize: "0.82rem", color: "#282830" }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f0faf5] font-sans">
      {/* Nav */}
      <nav className="bg-white border-b border-[#c5e6d5]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-[#02A257] font-black text-4xl tracking-tight">VITE</span>
          <div className="flex-1 flex justify-center">
            <Link href="/features" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#282830] hover:opacity-70 transition-opacity">
              Ce que VITE sait faire <ChevronDown size={14} />
            </Link>
          </div>
          <Link
            href="/dashboard?tab=plan"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#02A257] hover:bg-[#019048] transition-colors px-4 py-2 rounded-xl"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#02A257] opacity-[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#ff9359] opacity-[0.07] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-lg border border-[#c5e6d5]">
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <rect x="4" y="14" width="44" height="24" rx="12" stroke="#02A257" strokeWidth="5" fill="none"/>
            </svg>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-[#282830] tracking-tight leading-tight max-w-2xl">
            Prépare ta prochaine{" "}
            <span className="text-[#02A257]">course</span>
          </h1>

          <p className="text-[#656779] text-lg max-w-md leading-relaxed">
            Un plan sur mesure, une course dans le viseur ?<br />VITE s'adapte à ton niveau et ta dispo, et évolue avec toi au fil de tes séances — c'est l'IA à ton allure.
          </p>

          <Link
            href="/signup"
            className="mt-2 inline-flex items-center gap-2 bg-[#02A257] hover:bg-[#018f4c] text-white font-semibold px-7 py-4 rounded-2xl text-sm transition-colors shadow-sm"
          >
            Créer mon plan d'entraînement
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* App preview */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ transform: "rotate(-1.5deg)", transformOrigin: "top center" }}>
            <PlanPreviewCard />
          </div>
          <div style={{ transform: "rotate(1.5deg)", transformOrigin: "top center", marginTop: "2rem" }}>
            <StatsPreviewCard />
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div style={{ position: "relative", borderRadius: "24px", overflow: "hidden", maxHeight: "420px" }}>
          <Image
            src="/testimonial.avif"
            alt="Coureur en préparation"
            width={1200}
            height={600}
            style={{ width: "100%", height: "420px", objectFit: "cover", objectPosition: "center 30%" }}
          />
          {/* Gradient overlay */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0.3) 55%, transparent 100%)" }} />
          {/* Quote */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2rem 2rem 1.75rem" }}>
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#02A257", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.65rem" }}>
              ⭐️⭐️⭐️⭐️⭐️
            </div>
            <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "white", lineHeight: 1.55, maxWidth: "520px", marginBottom: "1rem" }}>
              "J'utilise VITE pour m'aider dans ma prépa, l'adaptation des plans est dingue. Je me rapproche à chaque course des 2h !"
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#02A257", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: "white", flexShrink: 0 }}>E</div>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "white" }}>Eliud — Iten, Kenya</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.55)" }}>Marathon · Objectif 1h58</div>
              </div>
            </div>
          </div>
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

      {/* App CTA */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
        <div style={{ background: "#02A257", borderRadius: "28px", padding: "3rem 2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          {/* Blobs déco */}
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
          <div style={{ position: "absolute", bottom: "-60px", left: "-30px", width: "240px", height: "240px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>Bientôt disponible</div>
            <h2 style={{ fontSize: "2rem", fontWeight: "900", color: "white", marginBottom: "0.75rem", lineHeight: 1.2 }}>
              VITE dans ta poche
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.75)", maxWidth: "380px", margin: "0 auto 2rem", lineHeight: 1.6 }}>
              L'app mobile arrive. Suis tes séances, consulte ton plan et valide tes courses — où que tu sois.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              {/* App Store */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.4rem", borderRadius: "14px", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", lineHeight: 1, marginBottom: "0.15rem" }}>Bientôt sur</div>
                  <div style={{ fontSize: "1rem", fontWeight: "800", color: "white", lineHeight: 1 }}>App Store</div>
                </div>
              </div>
              {/* Google Play */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.4rem", borderRadius: "14px", background: "rgba(255,255,255,0.12)", border: "1.5px solid rgba(255,255,255,0.2)", backdropFilter: "blur(4px)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M3.18 23.76c.3.17.64.22.97.15l11.18-11.18L12 9.4 3.18 23.76zm16.4-11.09L16.9 11.2 5.27.59c-.1-.1-.23-.17-.37-.2L16.58 11.2l2.99 1.47zM2.1.7C2.04.86 2 1.04 2 1.23v21.54c0 .19.04.37.1.53L13.6 12 2.1.7zm19.3 9.43l-2.32-1.14L15.8 12l3.28 3.28 2.32-1.14c.66-.32 1.1-.96 1.1-1.71s-.44-1.38-1.1-1.7z"/>
                </svg>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", lineHeight: 1, marginBottom: "0.15rem" }}>Bientôt sur</div>
                  <div style={{ fontSize: "1rem", fontWeight: "800", color: "white", lineHeight: 1 }}>Google Play</div>
                </div>
              </div>
            </div>
          </div>
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

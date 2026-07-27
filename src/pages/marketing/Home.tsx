import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEO, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { BrandFolder } from "@/components/marketing/folder/BrandFolder";
import { ReferenceCard } from "@/components/marketing/folder/ReferenceCard";
import { FolderMark } from "@/components/marketing/folder/FolderMark";
import { ArrowRight } from "lucide-react";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BDesign",
  alternateName: "BDesign by Because",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "BDesign turns any reference into a creative that's entirely yours. Built by Because for marketing agencies and brand teams.",
  parentOrganization: {
    "@type": "Organization",
    name: "Rellow Digital Private Limited",
    alternateName: "Because — Branding and Marketing Agency",
    url: "https://teambecause.com",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BDesign",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", priceCurrency: "INR", price: "0", description: "Credit-based plans, contact for quote" },
  url: SITE_URL,
  description:
    "Reference-driven AI creative generation. One brand folder per client, every generation stays on-brand.",
  publisher: { "@type": "Organization", name: "Because — Rellow Digital Private Limited" },
};

/* --- Sample folder brands for the "Built for teams" grid --- */
const agencyBrands = [
  { name: "Meridian", color: { light: "hsl(210 100% 74%)", deep: "hsl(210 76% 40%)" }, palette: ["#3D9BFF", "#14162B", "#FFFFFF"] },
  { name: "Kalrav", color: { light: "hsl(158 66% 60%)", deep: "hsl(158 71% 32%)" }, palette: ["#22C08E", "#0F3D2E", "#F4EEDF"] },
  { name: "Anantara", color: { light: "hsl(30 88% 68%)", deep: "hsl(20 80% 42%)" }, palette: ["#E8894B", "#3A2114", "#F5EBDF"] },
  { name: "Verity", color: { light: "hsl(232 20% 50%)", deep: "hsl(232 30% 22%)" }, palette: ["#3A3F5C", "#C9B99A", "#FAFAFB"] },
  { name: "DesignExe", color: { light: "hsl(335 100% 74%)", deep: "hsl(335 82% 48%)" }, palette: ["#FF5FA2", "#4E0F30", "#FFF6FA"] },
  { name: "LION", color: { light: "hsl(44 100% 66%)", deep: "hsl(39 80% 46%)" }, palette: ["#FFC93C", "#14162B", "#FFFFFF"] },
];

export default function Home() {
  return (
    <>
      <SEO
        title="BDesign — The internet is yours now."
        description="See it. Steal it. Brand it. Drop any reference into BDesign — it strips the specifics and rebuilds a creative from your brand."
        path="/"
        jsonLd={[orgSchema, softwareSchema]}
      />

      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden">
        {/* Soft canvas accents */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(60% 40% at 80% 10%, hsl(var(--blue-500) / 0.06) 0%, transparent 60%), radial-gradient(50% 40% at 10% 80%, hsl(var(--yellow-500) / 0.05) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-[1180px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 grid lg:grid-cols-12 gap-10 items-center relative">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 font-mono-sys text-[11px] uppercase tracking-[0.14em] text-blue-700 bg-blue-50 px-3 py-1.5 pill">
              <FolderMark size={14} /> built by because
            </span>
            <h1 className="mt-6 text-[44px] md:text-[64px] leading-[1.02] font-extrabold tracking-tight">
              The internet is{" "}
              <span className="yellow-underline animate-yellow-flash">yours</span>{" "}
              now.
            </h1>
            <p className="mt-5 text-[20px] md:text-[22px] font-semibold text-ink">
              See it. Steal it. Brand it.
            </p>
            <p className="mt-4 text-[16.5px] text-ink-soft max-w-xl leading-relaxed">
              Any ad, poster, or screenshot you saved becomes a fresh creative in your brand — same idea, entirely your logo, palette, and voice.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="pill inline-flex items-center gap-1.5 bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 glow-blue hover:brightness-110 transition"
              >
                Request access <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/features"
                className="pill inline-flex items-center border border-line bg-white text-ink text-[15px] font-semibold px-6 py-3 hover:border-ink-faint transition"
              >
                See how it works
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-ink-faint font-mono-sys">
              trusted by agency teams · real estate · education · consumer
            </p>
          </div>

          {/* Hero folder composition */}
          <div className="lg:col-span-6 relative h-[420px] md:h-[480px] flex items-center justify-center">
            {/* Scatter references drifting toward the folder */}
            <motion.div
              initial={{ opacity: 0, x: -120, y: -60, rotate: -12 }}
              animate={{ opacity: 1, x: -170, y: -110, rotate: -8 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute"
            >
              <ReferenceCard label="pinterest" scatter="coral" width={140} height={180} tilt={-8} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 100, y: -80, rotate: 10 }}
              animate={{ opacity: 1, x: 170, y: -120, rotate: 6 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute"
            >
              <ReferenceCard label="ig ad" scatter="violet" width={130} height={170} tilt={6} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -80, y: 100, rotate: 8 }}
              animate={{ opacity: 1, x: -190, y: 110, rotate: 5 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute"
            >
              <ReferenceCard label="poster" scatter="mint" width={120} height={160} tilt={5} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 120, y: 100, rotate: -8 }}
              animate={{ opacity: 1, x: 180, y: 130, rotate: -5 }}
              transition={{ duration: 0.9, delay: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute"
            >
              <ReferenceCard label="screenshot" scatter="pink" width={130} height={170} tilt={-5} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -180, rotate: -14 }}
              animate={{ opacity: 1, y: -180, rotate: -3 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute"
            >
              <ReferenceCard label="billboard" scatter="sky" width={110} height={140} tilt={-3} />
            </motion.div>

            {/* Central folder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative z-10"
            >
              <BrandFolder
                name="Your brand"
                size="xl"
                palette={["#3D63FF", "#FFC93C", "#14162B"]}
                state="active"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ 2. RECOGNITION ============ */}
      <section className="relative border-t border-line bg-paper overflow-hidden">
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <div className="absolute top-8 left-[8%] rotate-[-8deg]"><ReferenceCard label="ref" scatter="coral" width={90} height={120} tilt={0} /></div>
          <div className="absolute top-16 right-[10%] rotate-[6deg]"><ReferenceCard label="ref" scatter="violet" width={100} height={130} tilt={0} /></div>
          <div className="absolute bottom-10 left-[18%] rotate-[9deg]"><ReferenceCard label="ref" scatter="mint" width={80} height={110} tilt={0} /></div>
          <div className="absolute bottom-16 right-[22%] rotate-[-5deg]"><ReferenceCard label="ref" scatter="sky" width={90} height={120} tilt={0} /></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-ink-faint">is this for me?</p>
          <p className="mt-6 text-[26px] md:text-[32px] font-bold leading-tight tracking-tight text-ink">
            You have a folder like this somewhere. Screenshots of ads you liked. A poster you photographed off a wall. That launch post from a competitor that made you a little jealous.
          </p>
          <p className="mt-4 text-[18px] text-ink-soft">
            It's full. None of it ever became anything.
          </p>
          <p className="mt-6 text-[20px] font-semibold text-blue-700">
            This is where it finally does.
          </p>
        </div>
      </section>

      {/* ============ 3. MECHANISM — strip-and-rebuild ============ */}
      <section className="max-w-[1180px] mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">the mechanism</p>
            <h2 className="mt-4 text-[36px] md:text-[44px] font-extrabold leading-[1.05] tracking-tight">
              It can't copy the reference. Not by policy — by mechanism.
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                { n: "01", t: "Strip.", d: "Names, prices, faces, and literal text are removed from the reference before anything else runs." },
                { n: "02", t: "Read the shape.", d: "What survives is composition — focal weight, type placement, negative space, hierarchy." },
                { n: "03", t: "Rebuild from you.", d: "The generator never sees the reference. It sees your logo, your palette, your product shots, your voice." },
              ].map((s) => (
                <li key={s.n} className="flex gap-5">
                  <span className="font-mono-sys text-[13px] text-blue-500 pt-1">{s.n}</span>
                  <div>
                    <div className="text-[17px] font-bold text-ink">{s.t}</div>
                    <div className="mt-1 text-[15px] text-ink-soft leading-relaxed">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* THEIRS -> YOURS */}
          <div className="relative">
            <div className="rounded-folder border border-line bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-6">
                <span>theirs</span>
                <span>→</span>
                <span className="text-blue-700">yours</span>
              </div>
              <div className="grid grid-cols-2 gap-8 items-center">
                <div className="flex justify-center">
                  <ReferenceCard label="reference" scatter="coral" width={170} height={220} tilt={-4} />
                </div>
                <div className="flex justify-center">
                  <BrandFolder
                    name="Rebuilt on-brand"
                    size="md"
                    palette={["#3D63FF", "#FFC93C", "#14162B"]}
                    state="active"
                  />
                </div>
              </div>
              <p className="mt-6 text-[13px] text-ink-faint font-mono-sys text-center">
                same shape · zero shared pixels
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 4. THE RE-PROMPTING PROBLEM ============ */}
      <section className="border-t border-line bg-paper">
        <div className="max-w-[1180px] mx-auto px-6 py-24">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-ink-faint text-center">will this become a chore?</p>
          <h2 className="mt-4 text-center text-[32px] md:text-[40px] font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            You've already been asking ChatGPT to be on-brand every single time.
          </h2>
          <p className="mt-4 text-center text-[16px] text-ink-soft max-w-2xl mx-auto">
            Fine at the first creative. Painful at the fiftieth. Your brand doesn't live inside a chat — it lives inside a folder that remembers.
          </p>

          <div className="mt-14 grid md:grid-cols-2 gap-6">
            {/* ChatGPT chat mock */}
            <div className="rounded-folder border border-line bg-white p-6 shadow-sm">
              <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-4">every · single · time</div>
              <div className="space-y-3 text-[13.5px]">
                {[
                  "our primary is #3D63FF, secondary yellow, logo is a folder mark...",
                  "make it feel premium but not luxury, no stock photos of handshakes...",
                  "target audience is agency owners in tier-1 cities in India...",
                  "again — primary is #3D63FF, secondary yellow...",
                ].map((t, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-field bg-paper text-ink-soft border border-line"
                  >
                    <span className="font-mono-sys text-[10px] text-ink-faint block mb-1">you · {14 + i}:0{2 + i}</span>
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* BDesign one-click */}
            <div className="rounded-folder border-2 border-blue-500 bg-white p-6 shadow-lg glow-blue relative overflow-hidden">
              <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-blue-700 mb-4">once · forever</div>
              <div className="flex flex-col items-center gap-6 py-6">
                <BrandFolder
                  name="Your brand"
                  size="md"
                  palette={["#3D63FF", "#FFC93C", "#14162B"]}
                  state="active"
                />
                <div className="text-center">
                  <p className="text-[15px] text-ink font-semibold">Set up once.</p>
                  <p className="text-[14px] text-ink-soft mt-1">Every future creative already knows.</p>
                </div>
                <div className="w-full flex items-center gap-2 justify-center font-mono-sys text-[11px] text-ink-faint">
                  <span className="h-px flex-1 bg-line" />
                  <span>drop reference → generate</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 5. PROOF ============ */}
      <section className="max-w-[1180px] mx-auto px-6 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">show me</p>
            <h2 className="mt-3 text-[32px] md:text-[40px] font-extrabold tracking-tight">
              Real references. Real rebuilds.
            </h2>
          </div>
          <Link to="/features" className="text-[14px] font-semibold text-blue-700 hover:underline">
            See every feature →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { scatter: "coral" as const, brand: "Meridian", tint: { light: "hsl(210 100% 74%)", deep: "hsl(210 76% 40%)" }, palette: ["#3D9BFF", "#14162B", "#FFF"] },
            { scatter: "violet" as const, brand: "Kalrav", tint: { light: "hsl(158 66% 60%)", deep: "hsl(158 71% 32%)" }, palette: ["#22C08E", "#0F3D2E", "#F4EEDF"] },
            { scatter: "pink" as const, brand: "DesignExe", tint: { light: "hsl(335 100% 74%)", deep: "hsl(335 82% 48%)" }, palette: ["#FF5FA2", "#4E0F30", "#FFF6FA"] },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-6 rounded-folder border border-line bg-white">
              <ReferenceCard label="found" scatter={p.scatter} width={110} height={150} tilt={-4} />
              <div className="flex flex-col items-center">
                <span className="font-mono-sys text-[10px] uppercase tracking-wider text-yellow-700 bg-yellow-100 px-2 py-1 pill">
                  claimed
                </span>
                <ArrowRight className="h-4 w-4 text-ink-faint my-2" />
              </div>
              <BrandFolder
                name={p.brand}
                size="sm"
                color={p.tint}
                palette={p.palette}
                state="active"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ============ 6. BUILT FOR TEAMS ============ */}
      <section className="border-t border-line bg-paper">
        <div className="max-w-[1180px] mx-auto px-6 py-24">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-ink-faint">does this fit how i work?</p>
          <h2 className="mt-3 text-[32px] md:text-[40px] font-extrabold tracking-tight">
            Solo, or a wall of client brands.
          </h2>

          <div className="mt-14 grid lg:grid-cols-5 gap-10 items-start">
            {/* Solo */}
            <div className="lg:col-span-2 p-8 rounded-folder border border-line bg-white">
              <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-6">solo · in-house</div>
              <div className="flex justify-center py-6">
                <BrandFolder
                  name="Your brand"
                  size="lg"
                  palette={["#3D63FF", "#FFC93C", "#14162B"]}
                  state="active"
                />
              </div>
              <p className="mt-6 text-[15px] text-ink-soft leading-relaxed">
                One brand hub. Every reference lands here. Nothing to re-explain.
              </p>
            </div>

            {/* Agency grid */}
            <div className="lg:col-span-3 p-8 rounded-folder border border-line bg-white">
              <div className="flex items-center justify-between mb-6">
                <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-blue-700">agency workspace</div>
                <div className="font-mono-sys text-[10px] text-ink-faint">{agencyBrands.length + 1} folders</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-8 justify-items-center">
                {agencyBrands.map((b) => (
                  <BrandFolder
                    key={b.name}
                    name={b.name}
                    size="sm"
                    color={b.color}
                    palette={b.palette}
                  />
                ))}
                <BrandFolder name="Add" size="sm" state="empty" />
              </div>
              <p className="mt-8 text-[14px] text-ink-soft leading-relaxed">
                Every client is a folder in its own color. Isolated hubs, per-seat credits, one workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ 7. PRICING SHAPE + CLOSE ============ */}
      <section className="max-w-[1180px] mx-auto px-6 py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">what's this cost?</p>
            <h2 className="mt-3 text-[32px] md:text-[40px] font-extrabold tracking-tight">
              One credit per generation. Refunded if it fails.
            </h2>
          </div>
          <Link to="/pricing" className="text-[14px] font-semibold text-blue-700 hover:underline">
            Full pricing →
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: "Creator", d: "Solo or personal brand. Pay-as-you-go." },
            { t: "Business", d: "One or two brands, monthly credit bundle." },
            { t: "Agency", d: "Unlimited client folders, per-seat credits." },
            { t: "Enterprise", d: "API, approvals, custom volume." },
          ].map((p) => (
            <div key={p.t} className="p-6 rounded-folder border border-line bg-white hover:border-blue-500 hover:glow-blue transition">
              <div className="flex items-center gap-2 mb-3">
                <FolderMark size={16} />
                <span className="text-[15px] font-bold">{p.t}</span>
              </div>
              <p className="text-[14px] text-ink-soft leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h3 className="text-[28px] md:text-[36px] font-extrabold tracking-tight">
            Stop admiring things. Start owning them.
          </h3>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link
              to="/contact"
              className="pill inline-flex items-center gap-1.5 bg-blue-500 text-white text-[15px] font-semibold px-7 py-3.5 glow-blue hover:brightness-110 transition"
            >
              Request access <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/features"
              className="pill inline-flex items-center border border-line bg-white text-ink text-[15px] font-semibold px-7 py-3.5 hover:border-ink-faint transition"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

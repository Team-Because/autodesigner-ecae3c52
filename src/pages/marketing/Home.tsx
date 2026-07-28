import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEO, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { BrandFolder } from "@/components/marketing/folder/BrandFolder";
import { ReferenceCard } from "@/components/marketing/folder/ReferenceCard";
import { FolderMark } from "@/components/marketing/folder/FolderMark";
import { ArrowRight, Link2, Upload, ImageIcon } from "lucide-react";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BDesign",
  alternateName: "BDesign by Because",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "BDesign turns any reference on the internet into a creative that's entirely yours. Built by Because.",
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
  offers: { "@type": "Offer", priceCurrency: "INR", price: "0", description: "Free to start · credit-based generation" },
  url: SITE_URL,
  description:
    "Drop any ad, poster or screenshot. BDesign rebuilds it in your brand — set up once, never re-explained.",
  publisher: { "@type": "Organization", name: "Because — Rellow Digital Private Limited" },
};

export default function Home() {
  return (
    <>
      <SEO
        title="BDesign — The internet is yours now."
        description="Every ad you've screenshotted. Every layout you meant to steal. Drop it in — BDesign rebuilds it in your brand. One click."
        path="/"
        jsonLd={[orgSchema, softwareSchema]}
      />

      {/* ============ 1. HERO ============ */}
      <section className="relative overflow-hidden">
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
            <h1 className="mt-6 text-[44px] md:text-[68px] leading-[1.02] font-extrabold tracking-tight">
              The internet is{" "}
              <span className="yellow-underline animate-yellow-flash">yours</span>{" "}
              now.
            </h1>
            <p className="mt-6 text-[17.5px] text-ink-soft max-w-xl leading-relaxed">
              Every ad you've screenshotted. Every layout you've meant to steal.
              <br className="hidden md:block" />
              It's just sitting there.
            </p>
            <p className="mt-4 text-[19px] md:text-[20px] font-semibold text-ink max-w-xl leading-snug">
              Turn it into yours — in one click.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="pill inline-flex items-center gap-1.5 bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 glow-blue hover:brightness-110 transition"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#demo"
                className="pill inline-flex items-center border border-line bg-white text-ink text-[15px] font-semibold px-6 py-3 hover:border-ink-faint transition"
              >
                Try it now
              </a>
            </div>
          </div>

          {/* Hero folder composition */}
          <div className="lg:col-span-6 relative h-[420px] md:h-[480px] flex items-center justify-center">
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

      {/* ============ 2. PROBLEM + SOLUTION ============ */}
      <section className="border-t border-line bg-paper">
        <div className="max-w-[1180px] mx-auto px-6 py-24 md:py-28">
          {/* Problem */}
          <div className="max-w-3xl">
            <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-ink-faint">the folder problem</p>
            <h2 className="mt-4 text-[34px] md:text-[46px] font-extrabold leading-[1.05] tracking-tight">
              Why nothing ever gets made.
            </h2>
            <p className="mt-6 text-[17px] text-ink-soft leading-relaxed">
              You recreate it by hand. Or you hand it to an AI tool — and re-explain your brand from zero, every single time, because it forgets the moment you close the tab.
            </p>
          </div>

          {/* Solution */}
          <div className="mt-16 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <h2 className="text-[34px] md:text-[46px] font-extrabold leading-[1.05] tracking-tight">
                Now it's{" "}
                <span className="yellow-underline">yours</span>.
              </h2>
              <p className="mt-6 text-[17px] text-ink-soft leading-relaxed max-w-xl">
                Drop in the ad. We strip out everything that isn't yours and rebuild it with your colors, your product, your voice.
              </p>
              <p className="mt-4 text-[17px] font-semibold text-ink">
                Set your brand up once. Never explain it again.
              </p>
            </div>

            {/* Theirs → Yours visual */}
            <div className="lg:col-span-6">
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

          {/* Payoff line */}
          <div className="mt-20 text-center">
            <p className="text-[26px] md:text-[34px] font-bold tracking-tight leading-tight">
              Yours, before you even save it.
            </p>
            <p className="mt-3 text-[16px] text-ink-soft">
              See it anywhere. Click once. Done.
            </p>
          </div>
        </div>
      </section>

      {/* ============ 3. INTERACTIVE DEMO ============ */}
      <section id="demo" className="max-w-[1180px] mx-auto px-6 py-24 md:py-28">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">try it</p>
          <h2 className="mt-4 text-[34px] md:text-[46px] font-extrabold leading-[1.05] tracking-tight">
            See it. It's already yours.
          </h2>
          <p className="mt-5 text-[17px] text-ink-soft">
            Drop in a link, a screenshot, anything.
          </p>
        </div>

        <div className="mt-12 max-w-3xl mx-auto">
          <div
            className="rounded-folder border-2 border-dashed border-blue-500/50 bg-white p-10 md:p-14 text-center relative overflow-hidden glow-blue"
            style={{
              background:
                "linear-gradient(180deg, #ffffff 0%, hsl(var(--blue-500) / 0.03) 100%)",
            }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="w-11 h-11 rounded-field bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-blue-700" />
              </span>
              <span className="w-11 h-11 rounded-field bg-paper border border-line flex items-center justify-center">
                <Upload className="h-5 w-5 text-ink-soft" />
              </span>
              <span className="w-11 h-11 rounded-field bg-paper border border-line flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-ink-soft" />
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 max-w-xl mx-auto">
              <input
                type="text"
                placeholder="paste a link, or drop an image…"
                className="flex-1 rounded-field border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-blue-500 transition"
                aria-label="Paste a link or drop an image"
              />
              <Link
                to="/contact"
                className="pill inline-flex items-center justify-center gap-1.5 bg-blue-500 text-white text-[15px] font-semibold px-6 py-3 hover:brightness-110 transition"
              >
                Make it mine <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-6 font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              no signup to try · no credit used to look
            </p>
          </div>
        </div>
      </section>

      {/* ============ 4. HOW IT WORKS ============ */}
      <section className="border-t border-line bg-paper">
        <div className="max-w-[1180px] mx-auto px-6 py-24 md:py-28">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-ink-faint">how it works</p>
            <h2 className="mt-4 text-[34px] md:text-[44px] font-extrabold leading-[1.05] tracking-tight">
              Three steps to make it yours.
            </h2>
          </div>

          <div className="mt-16 grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Set up your brand.",
                d: "Logo, colors, voice. A few minutes, once.",
              },
              {
                n: "02",
                t: "Drop in a reference.",
                d: "Upload it, paste a link, or click it live — wherever you saw it.",
              },
              {
                n: "03",
                t: "Get your version.",
                d: "Same structure. None of the content. All your brand.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="p-7 rounded-folder border border-line bg-white transition hover:border-ink-faint"
              >
                <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-blue-700">
                  step {s.n}
                </div>
                <div className="mt-3 text-[20px] font-bold tracking-tight text-ink">{s.t}</div>
                <p className="mt-2 text-[15px] text-ink-soft leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 5. FEATURES ============ */}
      <section className="max-w-[1180px] mx-auto px-6 py-24 md:py-28">
        <div className="max-w-2xl">
          <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">everything else</p>
          <h2 className="mt-4 text-[34px] md:text-[44px] font-extrabold leading-[1.05] tracking-tight">
            Everything else that's yours too.
          </h2>
        </div>

        <ul className="mt-14 grid md:grid-cols-2 gap-4">
          {[
            { t: "One click, anywhere", d: "No saving, no visiting BDesign first." },
            { t: "Brand Hub", d: "Every brand, its own vault." },
            { t: "Multiple brands, one account", d: "Switch without re-entering anything." },
            { t: "Copy that doesn't repeat", d: "Tone rotates, stays on-voice." },
            { t: "Every format", d: "Landscape, square, portrait, story." },
            { t: "Full history", d: "Nothing disappears." },
            { t: "Fair credits", d: "Pay only when it works." },
          ].map((f) => (
            <li
              key={f.t}
              className="p-5 rounded-folder border border-line bg-white flex items-start gap-4"
            >
              <span className="mt-1 w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
              <div>
                <div className="text-[16px] font-bold text-ink">{f.t}</div>
                <div className="text-[14.5px] text-ink-soft mt-0.5">{f.d}</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link
            to="/features"
            className="text-[14px] font-semibold text-blue-700 hover:underline"
          >
            See every feature →
          </Link>
        </div>
      </section>

      {/* ============ 6. CLOSE ============ */}
      <section className="border-t border-line bg-paper">
        <div className="max-w-[900px] mx-auto px-6 py-24 md:py-32 text-center">
          <h2 className="text-[44px] md:text-[64px] font-extrabold tracking-tight leading-[1.02]">
            Make it{" "}
            <span className="yellow-underline">yours</span>.
          </h2>
          <div className="mt-10">
            <Link
              to="/contact"
              className="pill inline-flex items-center gap-1.5 bg-blue-500 text-white text-[16px] font-semibold px-8 py-4 glow-blue hover:brightness-110 transition"
            >
              Start Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

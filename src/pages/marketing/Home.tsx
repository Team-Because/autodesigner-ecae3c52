import { Link } from "react-router-dom";
import { SEO, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Layers, ShieldCheck, Wand2, ArrowRight } from "lucide-react";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MakeMyAd",
  alternateName: "MakeMyAd by Because",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "One-click AI creative generation platform for marketing agencies. Set up your brand once, generate on-brand ad creatives in seconds.",
  parentOrganization: {
    "@type": "Organization",
    name: "Rellow Digital Private Limited",
    alternateName: "Because — Branding and Marketing Agency",
    url: "https://teambecause.com",
    email: "aditya@teambecause.com",
    telephone: "+91-98796-32532",
    address: {
      "@type": "PostalAddress",
      streetAddress: "6th Floor, Sheth works, Adani Shantigram",
      addressLocality: "Ahmedabad",
      addressRegion: "Gujarat",
      postalCode: "382421",
      addressCountry: "IN",
    },
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "MakeMyAd",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", priceCurrency: "INR", price: "0", description: "Credit-based plans, contact for quote" },
  url: SITE_URL,
  description:
    "AI-powered creative generation platform for marketing agencies and brand teams.",
  publisher: { "@type": "Organization", name: "Because — Rellow Digital Private Limited" },
};

export default function Home() {
  return (
    <>
      <SEO
        title="MakeMyAd — AI Ad Creatives, On‑Brand, In One Click"
        description="MakeMyAd turns a reference layout plus your brand kit into a finished, on‑brand ad creative in seconds. Built by Because for marketing agencies. Request access today."
        path="/"
        jsonLd={[orgSchema, softwareSchema]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary bg-accent px-3 py-1.5 rounded-full">
              <Sparkles className="h-3.5 w-3.5" /> Built by Because
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-display font-bold leading-[1.05]">
              AI ad creatives.<br />
              <span className="text-primary">On‑brand.</span> In one click.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              MakeMyAd is the fastest way for marketing agencies to produce on‑brand ad creatives.
              Upload a reference, pick a brand from your{" "}
              <Link to="/features" className="text-foreground underline underline-offset-4 hover:text-primary">Brand Hub</Link>,
              and ship a polished creative in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/contact">Request access <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/features">See how it works</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Trusted by agency teams across real estate, education, and consumer brands.
            </p>
          </div>

          <div className="relative">
            <img
              src="/og-image.jpg"
              alt="MakeMyAd interface showing one-click AI ad creative generation for marketing agencies"
              width={1216}
              height={640}
              className="rounded-2xl border border-border shadow-2xl w-full h-auto"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-display font-bold max-w-2xl">
            A creative studio that respects your brand book — automatically.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            MakeMyAd is purpose‑built for the way agencies actually work. Set up each brand once, then generate on‑brand ad variants without re‑briefing the AI every time.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Zap, h: "One‑click generation", p: "Reference image plus a brand selection equals a finished ad creative. No prompts, no babysitting." },
              { icon: Layers, h: "Brand Hub at the core", p: "Logos, colour palettes, typography rules, voice and never‑rules — stored per brand and enforced on every generation." },
              { icon: ShieldCheck, h: "References as blueprints", p: "Layout structure is reused; subjects, names, locations, and pricing from the reference are never copied across." },
              { icon: Wand2, h: "Multi‑format output", p: "Square, portrait, landscape, and story formats from the same brand brief — without redoing the work." },
              { icon: Sparkles, h: "Fresh copy every time", p: "Headlines and sub‑copy are written for each creative with rotating moods, not recycled from your brief." },
              { icon: ArrowRight, h: "Built for agencies", p: "Multi‑account workflows, credit allocation, and global usage analytics for owners and ops leads." },
            ].map(({ icon: Icon, h, p }) => (
              <article key={h} className="p-6 rounded-2xl border border-border bg-card">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{h}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-display font-bold">How MakeMyAd works</h2>
        <ol className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { n: "01", h: "Set up your Brand Hub", p: "Add your logo, palette, typography, voice and never‑rules. Or paste an existing brand brief and let our AI auto‑fill it." },
            { n: "02", h: "Drop a reference", p: "Use any layout you like as a structural blueprint — uploaded, pasted, or sent in via our Chrome extension." },
            { n: "03", h: "Generate & ship", p: "Pick a format, hit generate, and download an on‑brand ad creative in seconds. Iterate or duplicate at will." },
          ].map((s) => (
            <li key={s.n} className="p-6 rounded-2xl border border-border bg-card">
              <div className="text-primary font-display font-bold text-2xl">{s.n}</div>
              <h3 className="mt-2 text-lg font-semibold">{s.h}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.p}</p>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/features">Explore every feature</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pricing">See pricing</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            Ready to make on‑brand ads in seconds?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tell us about your agency or brand and we'll get you set up with a workspace.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/contact">Request access</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">About Because</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

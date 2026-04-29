import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const sections = [
  {
    h: "Brand Hub — your brand kit, made operational",
    p: "Store every brand's logo set, colour palette, typography, brief, voice, target audience, example copy, and never‑rules. Brands can be grouped into campaigns, duplicated for variants, archived, or merged.",
  },
  {
    h: "AI Auto‑fill from a logo and a website",
    p: "Drop a logo, a few reference creatives, and a URL. MakeMyAd fills in industry, palette, asset tags, and a starter brief — so onboarding a new brand takes minutes, not hours.",
  },
  {
    h: "Studio — one‑click on‑brand generation",
    p: "Pick a reference, pick a brand, choose an aspect ratio, generate. The model uses your reference as a layout blueprint, then composes a fresh creative using only your brand assets and copy direction.",
  },
  {
    h: "Multiple output formats",
    p: "Square (1:1), portrait (4:5), landscape (16:9), and story (9:16). Generate once per format — no manual resizing.",
  },
  {
    h: "History with full traceability",
    p: "Every generation is saved alongside its reference, brand, format, and copy. Failed generations are filtered out so the gallery stays clean.",
  },
  {
    h: "Chrome extension",
    p: "Right‑click any image on the web and send it straight into MakeMyAd as a reference — no copy/paste workflow.",
  },
  {
    h: "Multi‑account & admin tools",
    p: "Agency owners can switch contexts, allocate credits, view global usage analytics, and transfer brands between accounts safely.",
  },
];

export default function Features() {
  return (
    <>
      <SEO
        title="Features — MakeMyAd AI Creative Platform"
        description="From Brand Hub to one-click Studio generation, multi-format output, history, Chrome extension, and admin tools — every MakeMyAd feature, explained for marketing teams."
        path="/features"
      />
      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          Everything an agency needs to ship on‑brand ads, faster.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          MakeMyAd is the production engine behind agencies that need consistent, on‑brand ad creatives across dozens of campaigns. Here's what's inside.
        </p>

        <div className="mt-14 space-y-10">
          {sections.map((s) => (
            <article key={s.h}>
              <h2 className="text-2xl font-display font-bold">{s.h}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{s.p}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-border bg-accent/40">
          <h2 className="text-2xl font-display font-bold">See it in your agency's workflow.</h2>
          <p className="mt-2 text-muted-foreground">
            Want a walkthrough?{" "}
            <Link to="/contact" className="underline text-foreground">Book a demo</Link>{" "}
            or{" "}
            <Link to="/pricing" className="underline text-foreground">review pricing</Link>{" "}
            — and explore the{" "}
            <Link to="/faq" className="underline text-foreground">FAQ</Link>.
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild><Link to="/contact">Request access</Link></Button>
            <Button asChild variant="outline"><Link to="/pricing">See pricing</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

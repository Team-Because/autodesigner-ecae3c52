import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Studio",
    audience: "Solo brand teams",
    blurb: "For in-house teams running a single brand or a small portfolio.",
    features: ["Up to 1 workspace", "Brand Hub with unlimited assets", "Square, portrait, landscape, story", "History & re‑generation", "Email support"],
  },
  {
    name: "Agency",
    audience: "Multi-brand teams",
    blurb: "For agencies running many brands and campaigns in parallel.",
    features: ["Multi-account workspaces", "Brand transfer & duplication", "Credit allocation per account", "Chrome extension", "Priority support"],
    featured: true,
  },
  {
    name: "Enterprise",
    audience: "Large agencies & brands",
    blurb: "For groups with custom volumes, governance, and integrations.",
    features: ["Volume credit pools", "Global usage analytics", "Admin tooling & access controls", "Custom onboarding by Because", "Dedicated success manager"],
  },
];

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing — MakeMyAd Credit‑Based AI Creative Plans"
        description="Simple credit-based pricing for AI creative generation. One credit per creative. Studio, Agency, and Enterprise plans for marketing teams. Get a quote."
        path="/pricing"
      />

      <section className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          One credit. One creative. Plans built for agencies.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          MakeMyAd uses a transparent credit‑based model — every generated creative costs one credit. Pick the plan that fits your team and grow without surprise overages.
        </p>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <article
              key={t.name}
              className={`p-6 rounded-2xl border ${t.featured ? "border-primary shadow-xl" : "border-border"} bg-card flex flex-col`}
            >
              {t.featured && (
                <span className="self-start text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                  Most popular
                </span>
              )}
              <h2 className="mt-3 text-2xl font-display font-bold">{t.name}</h2>
              <p className="text-sm text-muted-foreground">{t.audience}</p>
              <p className="mt-4 text-sm">{t.blurb}</p>
              <ul className="mt-6 space-y-2 text-sm flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-hidden /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6" variant={t.featured ? "default" : "outline"}>
                <Link to="/contact">Get a quote</Link>
              </Button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Have questions about credits or volume? Read the{" "}
          <Link to="/faq" className="underline text-foreground">FAQ</Link>{" "}
          or{" "}
          <Link to="/contact" className="underline text-foreground">talk to us</Link>.
        </p>
      </section>
    </>
  );
}

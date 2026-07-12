import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Starter",
    price: "[price]",
    cadence: "pay-as-you-go",
    audience: "One brand, occasional use",
    blurb: "For a solo team or a single brand testing the workflow.",
    features: [
      "1 Brand Hub",
      "Pay-as-you-go credits",
      "All four output formats",
      "History & re-generation",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "[price]",
    cadence: "per month",
    audience: "In-house teams, one or two brands",
    blurb: "Monthly credit bundle for teams shipping creative every week.",
    features: [
      "Up to 3 Brand Hubs",
      "Monthly credit bundle",
      "Priority queue",
      "Chrome extension",
      "Email support",
    ],
    featured: true,
  },
  {
    name: "Agency",
    price: "[price]",
    cadence: "per month",
    audience: "Agencies with multiple clients",
    blurb: "Unlimited client Brand Hubs, isolated per account, with per-seat credit tracking.",
    features: [
      "Unlimited client Brand Hubs",
      "Multi-account workspaces",
      "Per-seat credit tracking",
      "Brand transfer & duplication",
      "Admin usage analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "[price]",
    cadence: "custom",
    audience: "Large agencies & brand groups",
    blurb: "For teams that need API access, approval workflows, and negotiated volume.",
    features: [
      "API access",
      "Approval workflows",
      "Custom credit pools",
      "SSO & access controls",
      "Dedicated success manager",
    ],
  },
];

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing — BDesign Credit-Based Plans"
        description="Credit-based pricing for BDesign. Starter, Growth, Agency, and Enterprise plans. Credits are consumed per generation attempt and automatically refunded on failure."
        path="/pricing"
      />

      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Pricing</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          One credit per generation. Refunded if it fails.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          Credits are consumed when a generation starts. If it fails for any reason — the model errors out, the aspect ratio comes back wrong, anything — the credit is refunded automatically. You only pay for creatives you actually receive.
        </p>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-display font-bold text-foreground">{t.price}</span>
                <span className="text-sm text-muted-foreground">/ {t.cadence}</span>
              </div>
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
          Questions about credit volumes or migrating a team? Read the{" "}
          <Link to="/faq" className="underline text-foreground">FAQ</Link>{" "}
          or{" "}
          <Link to="/contact" className="underline text-foreground">talk to us</Link>.
        </p>
      </section>
    </>
  );
}

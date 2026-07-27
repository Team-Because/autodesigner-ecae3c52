import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Check } from "lucide-react";
import { FolderMark } from "@/components/marketing/folder/FolderMark";

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

      <section className="max-w-[1180px] mx-auto px-6 py-20">
        <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">pricing</p>
        <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          One credit per generation.{" "}
          <span className="yellow-underline">Refunded if it fails.</span>
        </h1>
        <p className="mt-5 text-[17px] text-ink-soft max-w-2xl leading-relaxed">
          A credit is consumed when a generation starts. If it fails — model error, wrong aspect ratio, anything — it's refunded automatically. You only pay for creatives you actually receive.
        </p>

        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((t) => (
            <article
              key={t.name}
              className={`p-6 rounded-folder border bg-white flex flex-col transition ${
                t.featured ? "border-blue-500 glow-blue" : "border-line hover:border-ink-faint"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FolderMark size={16} />
                  <h2 className="text-[17px] font-bold">{t.name}</h2>
                </div>
                {t.featured && (
                  <span className="font-mono-sys text-[10px] uppercase tracking-wider bg-yellow-100 text-yellow-700 px-2 py-0.5 pill">
                    popular
                  </span>
                )}
              </div>
              <p className="text-[13px] text-ink-faint">{t.audience}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[28px] font-extrabold tracking-tight text-ink">{t.price}</span>
                <span className="text-[13px] text-ink-faint">/ {t.cadence}</span>
              </div>
              <p className="mt-4 text-[14px] text-ink-soft leading-relaxed">{t.blurb}</p>
              <ul className="mt-6 space-y-2 text-[13.5px] flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-ink-soft">
                    <Check className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className={`pill mt-6 inline-flex items-center justify-center text-[14px] font-semibold px-4 py-2.5 transition ${
                  t.featured
                    ? "bg-blue-500 text-white hover:brightness-110"
                    : "border border-line text-ink hover:border-ink-faint"
                }`}
              >
                Get a quote
              </Link>
            </article>
          ))}
        </div>

        <p className="mt-10 text-[14px] text-ink-soft">
          Questions about credit volumes or migrating a team? Read the{" "}
          <Link to="/faq" className="underline text-ink">FAQ</Link>{" "}
          or{" "}
          <Link to="/contact" className="underline text-ink">talk to us</Link>.
        </p>
      </section>
    </>
  );
}

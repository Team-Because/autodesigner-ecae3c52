import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const faqs = [
  { q: "What is MakeMyAd?", a: "MakeMyAd is a one‑click AI creative generation platform that turns a reference layout plus your brand kit into a finished, on‑brand ad creative in seconds." },
  { q: "Who is MakeMyAd for?", a: "Marketing agencies, in‑house brand teams, and performance marketers who need to produce on‑brand ad creatives across formats — square, portrait, landscape, and story." },
  { q: "How is MakeMyAd different from generic AI image tools?", a: "MakeMyAd is built around a Brand Hub that enforces logos, colours, typography, voice, and never‑rules per brand. References are treated as layout blueprints — never copied verbatim." },
  { q: "How does pricing work?", a: "MakeMyAd uses a credit‑based model: one credit per generated creative. Plans are tailored per workspace. Contact us at aditya@teambecause.com for a quote." },
  { q: "Do you store my brand assets securely?", a: "Yes. Brand assets are stored in your private workspace with row‑level security. Only your account (and admins you authorise) can access them." },
  { q: "Which formats are supported?", a: "Square (1:1), portrait (4:5), landscape (16:9), and story (9:16). The same brand brief can produce variants in every format." },
  { q: "Is there a Chrome extension?", a: "Yes — right‑click any image on the web and send it straight into MakeMyAd as a reference. Available from the Brand Hub onboarding." },
  { q: "How do I get access?", a: "Accounts are admin‑created. Email aditya@teambecause.com or use the contact page to request a workspace." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FAQ() {
  return (
    <>
      <SEO
        title="FAQ — MakeMyAd AI Creative Platform Questions"
        description="Frequently asked questions about MakeMyAd: brand setup, pricing, formats, security, Chrome extension, and how to request access for your agency."
        path="/faq"
        jsonLd={[faqSchema]}
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          Frequently asked questions
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Everything you might want to know before getting your team onto MakeMyAd.
        </p>

        <div className="mt-12 space-y-8">
          {faqs.map((f) => (
            <article key={f.q}>
              <h2 className="text-xl font-display font-bold">{f.q}</h2>
              <p className="mt-2 text-muted-foreground leading-relaxed">{f.a}</p>
            </article>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Still have questions?{" "}
          <Link to="/contact" className="underline text-foreground">Contact our team</Link>{" "}
          or read more about{" "}
          <Link to="/features" className="underline text-foreground">what's inside MakeMyAd</Link>.
        </p>
      </section>
    </>
  );
}

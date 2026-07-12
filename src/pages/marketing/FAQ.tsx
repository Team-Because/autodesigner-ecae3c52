import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const faqs = [
  {
    q: "Does BDesign copy the reference I upload?",
    a: "No — and it's a mechanism, not a policy. Before any generation runs, the reference is analysed for structure only: composition, hierarchy, where the eye lands. Brand names, prices, faces, and literal text are stripped out at that step. The image generator never sees the original reference; it only sees the structural directive plus your brand assets.",
  },
  {
    q: "Can I use a competitor's ad as a reference?",
    a: "Yes. That's actually the point. Because names, prices, faces, and text are stripped before rebuilding, what carries over is composition, not identity. You get a creative built on the reference's structure using entirely your own brand.",
  },
  {
    q: "Why does the copy sound different each generation?",
    a: "Headlines and sub-copy are written from a rotating pool of tonal moods — declarative, curious, understated, playful, and so on — filtered against your brand's voice rules. It's designed so two creatives for the same brand don't hand you the same sentence twice.",
  },
  {
    q: "What happens if a generation comes out the wrong aspect ratio?",
    a: "It's checked automatically and re-rendered. Wrong-ratio outputs don't reach your history, and you don't get charged a credit for the attempt that failed.",
  },
  {
    q: "How do credits work?",
    a: "One credit per generation attempt. If the attempt fails for any reason — model error, aspect-ratio mismatch, anything — the credit is refunded automatically. You only pay for creatives you actually receive.",
  },
  {
    q: "Can my team share a workspace?",
    a: "Yes, on the Agency tier and up. Multiple accounts, isolated client Brand Hubs, per-seat credit tracking, and admin tools for moving brands and reviewing usage.",
  },
  {
    q: "How do I get access?",
    a: "Accounts are admin-created right now. Email aditya@teambecause.com or use the contact page and we'll set you up.",
  },
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
        title="FAQ — BDesign"
        description="Answers to the common questions about BDesign: how references are handled, competitor ads, copy variation, credits, refunds, and team workspaces."
        path="/faq"
        jsonLd={[faqSchema]}
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          Frequently asked questions
        </h1>

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
          <Link to="/features" className="underline text-foreground">what's inside BDesign</Link>.
        </p>
      </section>
    </>
  );
}

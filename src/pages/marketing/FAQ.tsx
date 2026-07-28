import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { FolderMark } from "@/components/marketing/folder/FolderMark";

const faqs = [
  {
    q: "Does B Design copy the reference I upload?",
    a: "No — and it's a mechanism, not a policy. Before any generation runs, the reference is analysed for structure only: composition, hierarchy, where the eye lands. Brand names, prices, faces, and literal text are stripped out at that step. The image generator never sees the original reference; it only sees the structural directive plus your brand assets.",
  },
  {
    q: "Can I use a competitor's ad as a reference?",
    a: "Yes. That's the point. Because names, prices, faces, and text are stripped before rebuilding, what carries over is composition, not identity.",
  },
  {
    q: "Why does the copy sound different each generation?",
    a: "Headlines and sub-copy rotate through tonal moods — declarative, curious, understated, playful — filtered against your brand voice. Two creatives for the same brand won't hand you the same sentence twice.",
  },
  {
    q: "What happens if a generation comes out the wrong aspect ratio?",
    a: "It's checked automatically and re-rendered. Wrong-ratio outputs don't reach your history, and you don't get charged.",
  },
  {
    q: "How do credits work?",
    a: "One credit per generation attempt. If the attempt fails for any reason, the credit is refunded automatically. You only pay for creatives you actually receive.",
  },
  {
    q: "Can my team share a workspace?",
    a: "Yes, on the Agency tier and up. Multiple accounts, isolated client Brand Hubs, per-seat credit tracking, admin tools for moving brands and reviewing usage.",
  },
  {
    q: "How do I get access?",
    a: "Accounts are admin-created right now. Email aditya@teambecause.com or use the contact page.",
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
        title="FAQ — B Design"
        description="How references are handled, competitor ads, copy variation, credits, refunds, and team workspaces."
        path="/faq"
        jsonLd={[faqSchema]}
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">faq</p>
        <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          Frequently asked questions
        </h1>

        <div className="mt-14 space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-folder border border-line bg-white p-6 hover:border-ink-faint transition open:border-blue-500 open:glow-blue">
              <summary className="cursor-pointer list-none flex items-start gap-3">
                <FolderMark size={16} />
                <span className="flex-1 text-[16.5px] font-bold text-ink">{f.q}</span>
                <span className="font-mono-sys text-[12px] text-ink-faint group-open:hidden">+</span>
                <span className="font-mono-sys text-[12px] text-ink-faint hidden group-open:inline">−</span>
              </summary>
              <p className="mt-4 pl-7 text-[15px] text-ink-soft leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <p className="mt-12 text-[14px] text-ink-soft">
          Still have questions?{" "}
          <Link to="/contact" className="underline text-ink">Contact our team</Link>{" "}
          or read{" "}
          <Link to="/features" className="underline text-ink">what's inside</Link>.
        </p>
      </section>
    </>
  );
}

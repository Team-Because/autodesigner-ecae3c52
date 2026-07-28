import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BrandFolder } from "@/components/marketing/folder/BrandFolder";
import { ReferenceCard } from "@/components/marketing/folder/ReferenceCard";
import { ArrowRight } from "lucide-react";

const features = [
  {
    tag: "01 · brand hub",
    h: "One folder per brand.",
    p: "Logo, palette, the fonts you actually ship, the voice you write in, and a list of things you never want to see. Never-rules matter more than most teams admit — 'no stock handshakes' is often the line between usable and throw-away.",
  },
  {
    tag: "02 · paste & parse",
    h: "Set up a brand in ten minutes, not an afternoon.",
    p: "Paste an existing brief — a strategy doc, a Notion page, a rough founder email. We pull out industry, palette, tone, audience, voice rules, and pre-fill the hub. You correct what we got wrong.",
  },
  {
    tag: "03 · reference is a blueprint",
    h: "The generator never sees the reference.",
    p: "Analysis reads the shape — focal weight, type placement, negative space — and writes a structural directive. Names, prices, faces, and literal text are stripped there. The image model only sees the directive plus your assets.",
    highlight: true,
  },
  {
    tag: "04 · four formats",
    h: "Square, portrait, landscape, story.",
    p: "Each rendered against its own aspect ratio, not resized from a master. Wrong-ratio outputs are caught and re-rendered before they reach your history.",
  },
  {
    tag: "05 · copy that doesn't repeat",
    h: "Fresh headline per generation.",
    p: "Copy is written from a rotating pool of moods — declarative, curious, understated, playful — filtered against your brand voice. Two creatives for the same brand won't hand you the same sentence.",
  },
  {
    tag: "06 · agency workspace",
    h: "Every client is its own folder.",
    p: "Isolated Brand Hubs per client, per-seat credit tracking, admin tools for switching context, moving brands, reviewing global usage. Month-end is a query, not a spreadsheet.",
  },
];

export default function Features() {
  return (
    <>
      <SEO
        title="Features — B Design"
        description="Inside B Design: the Brand Hub, Paste & Parse setup, reference-as-blueprint analysis, four-format output, mood-rotated copy, and agency workspaces."
        path="/features"
      />

      <section className="max-w-[1180px] mx-auto px-6 py-20">
        <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">features</p>
        <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          A brand hub and a generation engine that{" "}
          <span className="yellow-underline">talk to each other</span>.
        </h1>
        <p className="mt-5 text-[17px] text-ink-soft max-w-2xl leading-relaxed">
          The short version. The long version is below.
        </p>

        {/* How it works — folder journey */}
        <div className="mt-16 p-8 rounded-folder border border-line bg-paper">
          <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-ink-faint mb-8">how it works</div>
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="flex flex-col items-center">
              <BrandFolder name="Your brand" size="md" state="empty" />
              <p className="mt-6 text-[14px] text-ink-soft text-center">1. Set up the brand folder once.</p>
            </div>
            <div className="flex flex-col items-center relative">
              <div className="flex items-center gap-3">
                <ReferenceCard label="reference" scatter="coral" width={80} height={110} tilt={-6} />
                <ArrowRight className="h-5 w-5 text-ink-faint" />
                <BrandFolder name="Receiving" size="sm" state="receiving" palette={["#3D63FF", "#FFC93C", "#14162B"]} />
              </div>
              <p className="mt-6 text-[14px] text-ink-soft text-center">2. Drop any reference in.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <BrandFolder name="Ready" size="sm" palette={["#3D63FF", "#FFC93C", "#14162B"]} />
                <ArrowRight className="h-5 w-5 text-ink-faint" />
                <div
                  className="rounded-field bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center"
                  style={{ width: 96, height: 128 }}
                >
                  <span className="font-mono-sys text-[10px] text-blue-700">on-brand</span>
                </div>
              </div>
              <p className="mt-6 text-[14px] text-ink-soft text-center">3. A creative in your brand comes out.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-6">
          {features.map((f) => (
            <article
              key={f.tag}
              className={`p-7 rounded-folder border bg-white transition ${
                f.highlight ? "border-blue-500 glow-blue" : "border-line hover:border-ink-faint"
              }`}
            >
              <div className="font-mono-sys text-[11px] uppercase tracking-[0.14em] text-blue-700">{f.tag}</div>
              <h2 className="mt-3 text-[22px] font-bold tracking-tight text-ink">{f.h}</h2>
              <p className="mt-3 text-[15.5px] text-ink-soft leading-relaxed max-w-3xl">{f.p}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 p-8 rounded-folder border border-line bg-paper flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">See it in your team's workflow.</h2>
            <p className="mt-1 text-[14px] text-ink-soft">Want a walkthrough? Book a demo or review pricing.</p>
          </div>
          <div className="flex gap-3">
            <Link to="/contact" className="pill inline-flex items-center bg-blue-500 text-white text-[14px] font-semibold px-5 py-2.5 glow-blue hover:brightness-110 transition">
              Request access
            </Link>
            <Link to="/pricing" className="pill inline-flex items-center border border-line bg-white text-ink text-[14px] font-semibold px-5 py-2.5 hover:border-ink-faint transition">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

export default function Features() {
  return (
    <>
      <SEO
        title="Features — BDesign"
        description="What's actually inside BDesign: the Brand Hub, Paste & Parse setup, reference-as-blueprint analysis, four-format output, mood-rotated copy, and multi-account tooling for agencies."
        path="/features"
      />
      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Features</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          What's actually inside.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          The short version: BDesign is a Brand Hub and a generation engine that agrees to talk to each other. The longer version is below.
        </p>

        <div className="mt-14 space-y-14 text-muted-foreground leading-relaxed">
          {/* Brand Hub */}
          <article>
            <h2 className="text-2xl font-display font-bold text-foreground">The Brand Hub</h2>
            <p className="mt-3">
              Every brand lives here as a single, editable object — logo files, primary and secondary palette, the fonts you actually use in production (not the ones on the brand book nobody opens), the voice you write in, and a list of things you never want to see. Never‑rules matter more than most teams admit. "No stock photos of handshakes" is often the difference between usable output and something you have to throw away.
            </p>
            <p className="mt-3">
              Brands can be grouped into campaigns, duplicated when you want a variant, and transferred cleanly between accounts on Agency tier.
            </p>
          </article>

          {/* Paste & Parse */}
          <article>
            <h2 className="text-2xl font-display font-bold text-foreground">Paste & Parse setup</h2>
            <p className="mt-3">
              If a brand already has a written brief — a strategy doc, a Notion page, even a rough email from the founder — paste it in. We read it, pull out the industry, palette, tone descriptors, target audience, and starter voice rules, and pre‑fill the hub. You review, correct the parts we got wrong, and hit save. Onboarding a new brand goes from an afternoon to about ten minutes.
            </p>
          </article>

          {/* Reference-as-blueprint — the big one */}
          <article className="p-8 rounded-2xl border-l-4 border-primary bg-card">
            <h2 className="text-2xl font-display font-bold text-foreground">The reference is a blueprint, not a source</h2>
            <p className="mt-3">
              This is the piece worth understanding, because it's the one thing most AI image tools get wrong.
            </p>
            <p className="mt-3">
              When you drop in a reference, the analysis step doesn't hand it to the generator. It reads it — where the focal subject sits, how large the headline is relative to the image, whether type overlaps the subject or steps aside for it, where the logo lock‑up lives, what the negative space is doing — and writes a structural directive from that reading.
            </p>
            <p className="mt-3">
              What it explicitly does not carry forward: the brand name in the reference, any pricing, any faces, any literal text, any product identity. Those are stripped before the directive is written, not after. The generator that renders your final creative never sees the reference image at all. It sees the structural directive, your logo, your palette, your product photography, and your voice. That's it.
            </p>
            <p className="mt-3">
              The practical consequence: you can use a competitor's ad as a reference without producing a knock‑off. What survives is composition. What fills it in is you.
            </p>
          </article>

          {/* Four formats */}
          <article>
            <h2 className="text-2xl font-display font-bold text-foreground">Four formats from one brief</h2>
            <p className="mt-3">
              Square (1:1), portrait (4:5), landscape (16:9), and story (9:16). Each format is rendered against its own aspect ratio, not resized from a master — so the composition genuinely reflows instead of getting cropped weird. Wrong‑ratio outputs are caught and re‑rendered automatically before they reach your history.
            </p>
          </article>

          {/* Mood-rotated copy */}
          <article>
            <h2 className="text-2xl font-display font-bold text-foreground">Copy that doesn't repeat itself</h2>
            <p className="mt-3">
              Headlines and sub‑copy are written fresh per generation from a rotating pool of tonal moods — declarative, curious, understated, playful, benefit‑led, and so on — filtered against the voice rules in your brand. Two creatives for the same brand won't hand you the same sentence twice. The examples you paste into the brand brief are treated as stylistic reference, not templates to recycle.
            </p>
          </article>

          {/* Multi-account */}
          <article>
            <h2 className="text-2xl font-display font-bold text-foreground">Built for agencies with many clients</h2>
            <p className="mt-3">
              Agency accounts get isolated Brand Hubs per client, per‑account credit tracking, and admin tools for switching context, moving brands between accounts, and reviewing global usage. Every generation is tagged to the account and user that ran it, so month‑end reconciliation is a query, not a spreadsheet.
            </p>
          </article>
        </div>

        <div className="mt-16 p-8 rounded-2xl border border-border bg-accent/40">
          <h2 className="text-2xl font-display font-bold text-foreground">See it in your team's workflow.</h2>
          <p className="mt-2">
            Want a walkthrough?{" "}
            <Link to="/contact" className="underline text-foreground">Book a demo</Link>{" "}
            or{" "}
            <Link to="/pricing" className="underline text-foreground">review pricing</Link>.
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

import { Link } from "react-router-dom";
import { SEO, SITE_URL, DEFAULT_OG_IMAGE } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BDesign",
  alternateName: "BDesign by Because",
  url: SITE_URL,
  logo: `${SITE_URL}/logo-icon.png`,
  image: DEFAULT_OG_IMAGE,
  description:
    "BDesign turns a reference you liked into a creative that's entirely yours. Built by Because for marketing agencies and brand teams.",
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
  name: "BDesign",
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
        title="BDesign — The internet is yours now."
        description="Drop in a reference you liked. BDesign studies the structure, forgets the rest, and rebuilds it from your brand. Built by Because."
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
              The internet is <span className="text-primary">yours</span> now.
            </h1>
            <div className="mt-6 space-y-4 text-lg text-muted-foreground max-w-xl">
              <p>
                You have a folder like this somewhere. Screenshots of ads you liked. A poster you photographed off a wall for no real reason. That launch post from a competitor that made you a little jealous. It's full, and none of it has ever become anything.
              </p>
              <p>
                BDesign is where it finally does.
              </p>
              <p>
                Drop in whatever caught your eye. We study how it's built — where the eye lands first, how the type sits against the image — and forget everything else about it on purpose. Then we rebuild it from your logo, your colors, your product shots, your words. What comes out has never seen the inside of anyone else's brand.
              </p>
            </div>
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
              alt="BDesign interface — reference-driven, on-brand creative generation"
              width={1216}
              height={640}
              className="rounded-2xl border border-border shadow-2xl w-full h-auto"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Narrative value section */}
      <section className="border-t border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-6 py-20 space-y-6 text-lg text-foreground/90 leading-relaxed">
          <p>
            Set your brand up once — logo, colors, the fonts you actually use, and the things you never want to see. Ten minutes, and you're done with it for good.
          </p>
          <p>
            Bring us a reference, from anywhere. Pick a size. Watch it become yours in under a minute — because structurally, it came from your own design system. We just skipped the afternoon it used to take.
          </p>

          <div className="mt-10 p-8 rounded-2xl border-l-4 border-primary bg-card">
            <p className="text-foreground">
              Here's the part worth knowing: it can't actually copy anything. Not as a policy — as a mechanism. Every reference gets stripped of names, prices, faces, and text before anything is rebuilt. What survives is structure. What fills it back in is entirely yours.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-display font-bold">How BDesign works</h2>
        <ol className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { n: "01", h: "Set up your Brand Hub", p: "Logo, palette, typography, voice, and the stuff you never want to see. Paste an existing brand brief and let it fill itself in, or do it by hand." },
            { n: "02", h: "Drop in a reference", p: "An ad, a Pinterest board, a screenshot you don't remember saving. It doesn't matter where it's from." },
            { n: "03", h: "Generate & ship", p: "Pick a format, hit generate, get a creative that looks like it came from your own team — because structurally, it did." },
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
            Ready to stop admiring things and start owning them?
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

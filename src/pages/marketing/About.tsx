import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export default function About() {
  return (
    <>
      <SEO
        title="About — MakeMyAd by Because, Branding Agency in Ahmedabad"
        description="MakeMyAd is built by Because (Rellow Digital Private Limited), a branding & marketing agency in Ahmedabad working with brands across real estate, education, and consumer goods."
        path="/about"
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">About</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          MakeMyAd is built by an agency, for agencies.
        </h1>

        <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground leading-relaxed">
          <p>
            MakeMyAd is a product of <strong>Because — Branding &amp; Marketing Agency</strong>
            {" "}(legally <strong>Rellow Digital Private Limited</strong>), based in Ahmedabad, Gujarat, India.
            For years, our team has shipped creative work across real estate launches, ed‑tech brands,
            consumer goods, and lifestyle businesses. We built MakeMyAd because the creative production
            problem we saw inside our own studio is the same one every other serious agency is trying to solve.
          </p>

          <h2 className="text-foreground">The problem we set out to fix</h2>
          <p>
            Brand teams have well‑defined brand books — but turning that book into <em>twenty</em>
            {" "}on‑brand creatives a week takes hours of designer time. Generic AI image tools don't help:
            they ignore the brand book, hallucinate logos, and turn references into knock‑offs.
            MakeMyAd treats your brand book as the source of truth and a reference image as a layout
            blueprint — never as a template to copy.
          </p>

          <h2 className="text-foreground">What we believe</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Brand fidelity is non‑negotiable. Logos, colour, and typography must be respected.</li>
            <li>References inspire structure. They should never leak subjects, names, or pricing.</li>
            <li>Copy should be written fresh each time, not recycled from the brief.</li>
            <li>Speed matters — but only when it ships work the brand owner is proud of.</li>
          </ul>

          <h2 className="text-foreground">Want to work with us?</h2>
          <p>
            Whether you're an agency exploring MakeMyAd or a brand looking for a creative partner,
            you can{" "}
            <Link to="/contact" className="text-primary underline">talk to our team</Link>
            {" "}or visit{" "}
            <a href="https://teambecause.com" rel="noopener" className="text-primary underline">
              teambecause.com
            </a>
            {" "}to see our case studies.
          </p>
        </div>
      </section>
    </>
  );
}

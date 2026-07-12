import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export default function About() {
  return (
    <>
      <SEO
        title="About — BDesign by Because"
        description="BDesign started as an internal tool at Because, a branding and marketing agency in Ahmedabad. It worked well enough that we're opening it up."
        path="/about"
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">About</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          BDesign started as an internal tool.
        </h1>

        <div className="prose prose-neutral mt-8 max-w-none text-muted-foreground leading-relaxed">
          <p>
            We're <strong>Because</strong> — a branding and marketing agency in Ahmedabad (legally, <strong>Rellow Digital Private Limited</strong>). We work with brands across real estate, education, and consumer goods, and like every agency, we spent a lot of afternoons re‑briefing the same brand context for every new creative reference a client sent us.
          </p>
          <p>
            BDesign started as an internal fix for that. A place where each brand lived once, properly, and any reference could be dropped in and rebuilt without a designer walking the model through the brand book again. It got good enough at that job that our team stopped opening Photoshop for adaptation work.
          </p>
          <p>
            We're opening it up because the problem isn't ours alone. If you run an agency or an in‑house brand team and you've felt the same friction, it'll probably help.
          </p>
          <p>
            Want to talk?{" "}
            <Link to="/contact" className="text-primary underline">Contact the team</Link>{" "}
            or visit{" "}
            <a href="https://teambecause.com" rel="noopener" className="text-primary underline">
              teambecause.com
            </a>{" "}
            for the agency's case studies.
          </p>
        </div>
      </section>
    </>
  );
}

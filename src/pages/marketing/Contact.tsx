import { Link } from "react-router-dom";
import { SEO, SITE_URL } from "@/components/SEO";
import { Mail, Phone, MapPin } from "lucide-react";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact`,
  name: "Contact MakeMyAd",
  about: {
    "@type": "Organization",
    name: "Rellow Digital Private Limited",
    alternateName: "Because — Branding and Marketing Agency",
    email: "aditya@teambecause.com",
    telephone: "+91-98796-32532",
    address: {
      "@type": "PostalAddress",
      streetAddress: "6th Floor, Sheth works, Adani Shantigram, Adani Circle, B/S Lake, near Zero Point, Khodiyar",
      addressLocality: "Ahmedabad",
      addressRegion: "Gujarat",
      postalCode: "382421",
      addressCountry: "IN",
    },
  },
};

export default function Contact() {
  return (
    <>
      <SEO
        title="Contact MakeMyAd — Request Access for Your Agency"
        description="Talk to the Because team about MakeMyAd. Request access, ask about pricing, or book a walkthrough for your marketing agency or brand team."
        path="/contact"
        jsonLd={[contactSchema]}
      />

      <section className="max-w-4xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Contact</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          Talk to our team about MakeMyAd.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
          Whether you want a demo, a price quote, or a workspace for your agency — drop us a note and we'll get back within one business day.
        </p>

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <article className="p-6 rounded-2xl border border-border bg-card">
            <Mail className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Email</h2>
            <p className="text-sm text-muted-foreground">For business enquiries and access requests.</p>
            <a href="mailto:aditya@teambecause.com" className="mt-3 inline-block text-primary underline">
              aditya@teambecause.com
            </a>
          </article>

          <article className="p-6 rounded-2xl border border-border bg-card">
            <Phone className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Phone</h2>
            <p className="text-sm text-muted-foreground">Mon–Fri, 10:00–19:00 IST.</p>
            <a href="tel:+919879632532" className="mt-3 inline-block text-primary underline">
              +91 98796 32532
            </a>
          </article>

          <article className="p-6 rounded-2xl border border-border bg-card md:col-span-2">
            <MapPin className="h-5 w-5 text-primary" aria-hidden />
            <h2 className="mt-3 text-lg font-semibold">Office</h2>
            <address className="not-italic mt-2 text-sm text-muted-foreground leading-relaxed">
              Because — Branding &amp; Marketing Agency<br />
              Rellow Digital Private Limited<br />
              6th Floor, Sheth works, Adani Shantigram, Adani Circle, B/S Lake,<br />
              near Zero Point, Khodiyar, Ahmedabad, Gujarat 382421, India
            </address>
          </article>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Prefer to learn more first? See{" "}
          <Link to="/features" className="underline text-foreground">all features</Link>,{" "}
          <Link to="/pricing" className="underline text-foreground">pricing</Link>,{" "}
          or browse the{" "}
          <Link to="/faq" className="underline text-foreground">FAQ</Link>.
        </p>
      </section>
    </>
  );
}

import { Link } from "react-router-dom";
import { SEO, SITE_URL } from "@/components/SEO";
import { Mail, Phone, MapPin } from "lucide-react";

const contactSchema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${SITE_URL}/contact`,
  name: "Contact BDesign",
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
        title="Contact BDesign — Request Access for Your Team"
        description="Talk to the Because team about BDesign. Request access, ask about pricing, or book a walkthrough."
        path="/contact"
        jsonLd={[contactSchema]}
      />

      <section className="max-w-[1180px] mx-auto px-6 py-20">
        <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">contact</p>
        <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          Talk to the{" "}
          <span className="yellow-underline">Because</span>{" "}
          team.
        </h1>
        <p className="mt-5 text-[17px] text-ink-soft max-w-2xl leading-relaxed">
          Demo, quote, or a workspace for your agency — drop us a note and we'll get back within one business day.
        </p>

        <div className="mt-14 grid md:grid-cols-2 gap-5">
          <article className="p-7 rounded-folder border border-line bg-white hover:border-blue-500 transition">
            <Mail className="h-5 w-5 text-blue-500" aria-hidden />
            <h2 className="mt-4 text-[17px] font-bold">Email</h2>
            <p className="text-[13.5px] text-ink-faint mt-1">Business enquiries &amp; access.</p>
            <a href="mailto:aditya@teambecause.com" className="mt-3 inline-block text-blue-700 underline text-[15px]">
              aditya@teambecause.com
            </a>
          </article>

          <article className="p-7 rounded-folder border border-line bg-white hover:border-blue-500 transition">
            <Phone className="h-5 w-5 text-blue-500" aria-hidden />
            <h2 className="mt-4 text-[17px] font-bold">Phone</h2>
            <p className="text-[13.5px] text-ink-faint mt-1">Mon–Fri, 10:00–19:00 IST.</p>
            <a href="tel:+919879632532" className="mt-3 inline-block text-blue-700 underline text-[15px]">
              +91 98796 32532
            </a>
          </article>

          <article className="p-7 rounded-folder border border-line bg-white md:col-span-2">
            <MapPin className="h-5 w-5 text-blue-500" aria-hidden />
            <h2 className="mt-4 text-[17px] font-bold">Office</h2>
            <address className="not-italic mt-2 text-[14.5px] text-ink-soft leading-relaxed">
              Because — Branding &amp; Marketing Agency<br />
              Rellow Digital Private Limited<br />
              6th Floor, Sheth works, Adani Shantigram, Adani Circle, B/S Lake,<br />
              near Zero Point, Khodiyar, Ahmedabad, Gujarat 382421, India
            </address>
          </article>
        </div>

        <p className="mt-12 text-[14px] text-ink-soft">
          Prefer to learn more first? See{" "}
          <Link to="/features" className="underline text-ink">features</Link>,{" "}
          <Link to="/pricing" className="underline text-ink">pricing</Link>, or the{" "}
          <Link to="/faq" className="underline text-ink">FAQ</Link>.
        </p>
      </section>
    </>
  );
}

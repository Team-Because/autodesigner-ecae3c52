import { SEO } from "@/components/SEO";

export default function Trust() {
  return (
    <>
      <SEO
        title="Trust, Privacy & Security — MakeMyAd"
        description="How MakeMyAd handles your brand data, who can access it, the platform controls we rely on, and how to reach us about security or privacy questions."
        path="/trust"
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Trust Center</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold">
          Trust, privacy & security
        </h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          This page is maintained by <strong>Rellow Digital Private Limited</strong> (the company behind MakeMyAd)
          to answer common security and privacy questions about MakeMyAd. It is app‑owned editable content —
          not an independent audit or certification.
        </p>

        <div className="prose prose-neutral mt-12 max-w-none text-muted-foreground leading-relaxed">
          <h2 className="text-foreground">Accounts & access</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Accounts are created by a MakeMyAd admin and protected by an email address and password.</li>
            <li>Sessions are managed by our backend provider and are scoped to the signed‑in user.</li>
            <li>Admin functionality (user management, account switching, global history) is gated by a server‑side role check, not by anything the browser can claim.</li>
          </ul>

          <h2 className="text-foreground">How your data is isolated</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your brands, brand assets, and generated creatives are stored in row‑level‑secured database tables. Each row is bound to your user account.</li>
            <li>Generations are visible only to the user who created them; the only exception is the MakeMyAd admin role, which can view global history for support and quality review.</li>
            <li>Server‑side functions verify your session before running any AI work or touching billing.</li>
          </ul>

          <h2 className="text-foreground">Platform & hosting</h2>
          <p>
            MakeMyAd runs on managed cloud infrastructure provided by our backend platform. Database traffic, file
            storage, and authentication are handled by that platform, and connections to the app are served over HTTPS.
            We describe enabled platform capabilities factually here — this is not a certification claim.
          </p>

          <h2 className="text-foreground">Subprocessors we rely on</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Backend platform</strong> — database, auth, file storage, and serverless functions.</li>
            <li><strong>AI providers</strong> — used to analyse references and render creatives. The brand brief, reference images, and brand assets you submit are sent to these providers strictly to fulfil your generation request.</li>
          </ul>
          <p>
            We do not sell your data and we do not use your brand briefs or creatives to train third‑party models.
          </p>

          <h2 className="text-foreground">Retention & deletion</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Brands, assets, and generations remain in your account until you (or an admin acting on your request) delete them.</li>
            <li>To request deletion of an account or specific data, email us at the address below and we will action it.</li>
          </ul>

          <h2 className="text-foreground">Reporting a security issue</h2>
          <p>
            If you believe you have found a security vulnerability in MakeMyAd, please contact us at{" "}
            <a href="mailto:hello@becausebranding.in" className="text-primary underline">
              hello@becausebranding.in
            </a>
            {" "}with the words "Security report" in the subject. We will acknowledge your report and work with you
            on a fix.
          </p>

          <h2 className="text-foreground">Privacy questions</h2>
          <p>
            For privacy requests, data exports, or any question about how your information is handled, reach the
            same address above and we will respond.
          </p>
        </div>
      </section>
    </>
  );
}

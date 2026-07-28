import { SEO } from "@/components/SEO";

export default function Trust() {
  return (
    <>
      <SEO
        title="Trust, Privacy & Security — B Design"
        description="How B Design processes reference images, isolates client brand vaults, and handles credits on failed generations."
        path="/trust"
      />

      <section className="max-w-3xl mx-auto px-6 py-20">
        <p className="font-mono-sys text-[11px] uppercase tracking-[0.16em] text-blue-700">trust center</p>
        <h1 className="mt-4 text-[40px] md:text-[52px] font-extrabold tracking-tight leading-[1.05]">
          Trust, privacy &amp; security
        </h1>
        <p className="mt-6 text-ink-soft leading-relaxed text-[16px]">
          This page is maintained by <strong className="text-ink">Rellow Digital Private Limited</strong> (the company behind B Design)
          to answer common security and privacy questions. It is app-owned editable content — not an independent
          audit or certification.
        </p>

        <div className="prose prose-neutral mt-12 max-w-none text-muted-foreground leading-relaxed">
          <h2 className="text-foreground">How reference images are processed</h2>
          <p>
            When you upload a reference, it is not passed to the image generator. It first goes through an
            analysis step that reads only the structural properties of the image: composition, focal weighting,
            type placement, negative space, and colour distribution. During that same step, brand names, prices,
            depictions of specific people, and any literal text are explicitly stripped out before a structural
            directive is written.
          </p>
          <p>
            The image generator that renders your final creative receives that structural directive together with
            your logo, palette, product assets, and voice rules. It does not receive the original reference image.
            This is a real step in the pipeline — not a disclaimer — and it is why references from anywhere on the
            open web can be used without producing a knock‑off.
          </p>

          <h2 className="text-foreground">Client brand vault isolation</h2>
          <p>
            On the Agency tier, each client account has its own isolated Brand Hub. Assets, briefs, and
            generations belonging to one client account are not readable by another client account on the same
            agency workspace. Access to a given account is controlled by the agency admin. Row‑level security on
            our backend enforces this at the database layer, not just in the UI.
          </p>

          <h2 className="text-foreground">Accounts & access</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Accounts are created by a B Design admin and protected by an email address and password.</li>
            <li>Sessions are managed by our backend provider and are scoped to the signed‑in user.</li>
            <li>Admin functionality (user management, account switching, global history) is gated by a server‑side role check, not by anything the browser can claim.</li>
          </ul>

          <h2 className="text-foreground">Credits & failed generations</h2>
          <p>
            A credit is consumed when a generation attempt begins and is refunded automatically if the attempt
            fails — model errors, aspect‑ratio mismatches caught by the auto‑retry step, or any downstream
            failure. You are only billed for creatives that reach your history.
          </p>

          <h2 className="text-foreground">Platform & hosting</h2>
          <p>
            B Design runs on managed cloud infrastructure. Database traffic, file storage, authentication, and
            serverless functions are handled by that platform, and connections to the app are served over HTTPS.
            We describe enabled platform capabilities factually here — this is not a certification claim.
          </p>

          <h2 className="text-foreground">Subprocessors we rely on</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Backend platform</strong> — database, auth, file storage, and serverless functions.</li>
            <li><strong>AI providers</strong> — used to analyse reference structure and render creatives. The structural directive, your logo, and your brand assets are sent to these providers strictly to fulfil your generation request.</li>
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
            If you believe you have found a security vulnerability in B Design, please contact us at{" "}
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

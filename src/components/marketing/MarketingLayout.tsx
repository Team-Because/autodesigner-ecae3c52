import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export const MarketingLayout = () => (
  <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-primary focus:text-primary-foreground focus:px-3 focus:py-2 focus:rounded-md focus:z-50"
    >
      Skip to content
    </a>

    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg" aria-label="MakeMyAd home">
          <img src="/logo-icon.png" alt="MakeMyAd logo" width={28} height={28} className="rounded" />
          <span>MakeMyAd</span>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">by Because</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-7 text-sm font-medium">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login" aria-label="Sign in to MakeMyAd">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/contact" aria-label="Request access to MakeMyAd">Request access</Link>
          </Button>
        </div>
      </div>
    </header>

    <main id="main" className="flex-1">
      <Outlet />
    </main>

    <footer className="border-t border-border bg-muted/30 mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <img src="/logo-icon.png" alt="MakeMyAd" width={24} height={24} className="rounded" />
            MakeMyAd
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            One-click AI creative generation, built by{" "}
            <a href="https://teambecause.com" className="underline hover:text-foreground" rel="noopener">
              Because
            </a>{" "}
            for marketing agencies.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-sm font-semibold mb-3">Product</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/features" className="hover:text-foreground">AI creative features</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing &amp; plans</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">Frequently asked questions</Link></li>
            <li><Link to="/login" className="hover:text-foreground">Sign in to the studio</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-sm font-semibold mb-3">Company</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About Because</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact our team</Link></li>
            <li><a href="https://teambecause.com" rel="noopener" className="hover:text-foreground">Because agency site</a></li>
            <li><a href="/llm.html" className="hover:text-foreground">For AI assistants</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold mb-3">Contact</h2>
          <address className="not-italic text-sm text-muted-foreground space-y-1">
            <div>Rellow Digital Private Limited</div>
            <div>Ahmedabad, Gujarat, India</div>
            <div><a href="mailto:aditya@teambecause.com" className="hover:text-foreground">aditya@teambecause.com</a></div>
            <div><a href="tel:+919879632532" className="hover:text-foreground">+91 98796 32532</a></div>
          </address>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 justify-between">
          <p>© {new Date().getFullYear()} Rellow Digital Private Limited. All rights reserved.</p>
          <p>MakeMyAd is a product of Because — Branding &amp; Marketing Agency.</p>
        </div>
      </div>
    </footer>
  </div>
);

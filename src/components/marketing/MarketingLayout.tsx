import { Link, NavLink, Outlet } from "react-router-dom";
import { FolderMark } from "./folder/FolderMark";

const nav = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export const MarketingLayout = () => (
  <div className="min-h-screen flex flex-col bg-background text-ink font-sans">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-blue-500 focus:text-white focus:px-3 focus:py-2 focus:rounded-pill focus:z-50"
    >
      Skip to content
    </a>

    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-line">
      <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-[17px] tracking-tight" aria-label="B Design home">
          <FolderMark size={22} />
          <span>B Design</span>
          <span className="hidden sm:inline font-mono-sys text-[11px] font-normal text-ink-faint">by Because</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                [
                  "relative px-3.5 py-2 text-[14.5px] font-medium transition-colors",
                  isActive
                    ? "text-ink"
                    : "text-ink-soft hover:text-ink",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-t-[10px] rounded-b-[6px] bg-blue-50 border border-blue-100 border-b-blue-500"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className="relative">{n.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline text-[14px] font-medium text-ink-soft hover:text-ink px-3 py-2"
          >
            Sign in
          </Link>
          <Link
            to="/contact"
            className="pill inline-flex items-center bg-blue-500 text-white text-[14px] font-semibold px-5 py-2.5 glow-blue hover:brightness-110 transition"
          >
            Request access
          </Link>
        </div>
      </div>
    </header>

    <main id="main" className="flex-1">
      <Outlet />
    </main>

    <footer className="border-t border-line bg-paper mt-24">
      <div className="max-w-[1180px] mx-auto px-6 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 font-bold text-[15px]">
            <FolderMark size={20} />
            B Design
          </Link>
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            One folder per brand. Every reference on the internet lands inside yours.
          </p>
          <p className="text-xs text-ink-faint mt-3">
            Built by{" "}
            <a href="https://teambecause.com" className="underline hover:text-ink" rel="noopener">
              Because
            </a>{" "}
            — a branding &amp; marketing agency.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-[13px] font-mono-sys uppercase tracking-wider text-ink-faint mb-4">Product</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li><Link to="/features" className="hover:text-ink">Features</Link></li>
            <li><Link to="/pricing" className="hover:text-ink">Pricing</Link></li>
            <li><Link to="/faq" className="hover:text-ink">FAQ</Link></li>
            <li><Link to="/login" className="hover:text-ink">Sign in</Link></li>
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="text-[13px] font-mono-sys uppercase tracking-wider text-ink-faint mb-4">Company</h2>
          <ul className="space-y-2.5 text-sm text-ink-soft">
            <li><Link to="/about" className="hover:text-ink">About Because</Link></li>
            <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
            <li><Link to="/trust" className="hover:text-ink">Trust &amp; privacy</Link></li>
            <li><a href="https://teambecause.com" rel="noopener" className="hover:text-ink">teambecause.com</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[13px] font-mono-sys uppercase tracking-wider text-ink-faint mb-4">Contact</h2>
          <address className="not-italic text-sm text-ink-soft space-y-1.5">
            <div>Rellow Digital Pvt. Ltd.</div>
            <div>Ahmedabad, Gujarat, India</div>
            <div><a href="mailto:aditya@teambecause.com" className="hover:text-ink">aditya@teambecause.com</a></div>
            <div><a href="tel:+919879632532" className="hover:text-ink">+91 98796 32532</a></div>
          </address>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-[1180px] mx-auto px-6 py-5 text-xs text-ink-faint flex flex-col sm:flex-row gap-2 justify-between">
          <p>© {new Date().getFullYear()} Rellow Digital Private Limited.</p>
          <p className="font-mono-sys">B Design — a product of Because</p>
        </div>
      </div>
    </footer>
  </div>
);

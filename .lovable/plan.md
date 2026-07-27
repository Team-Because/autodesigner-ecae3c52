## BDesign — Folder-First Marketing Site Redesign

Rebuild the marketing surface around one central metaphor: a macOS-style **brand folder**. Blue = ownership, yellow = the moment of claim, accent scatter = unclaimed references from the internet. White canvas, Plus Jakarta Sans, Apple-clean.

Scope is **marketing pages only** (`src/pages/marketing/*`, `MarketingLayout`, `SEO`, `index.html`, `index.css`, `tailwind.config.ts`, new components under `src/components/marketing/folder/`). No changes to Studio, Brand Hub, edge functions, or the extension.

---

### 1. Design tokens & foundation

Update `src/index.css` + `tailwind.config.ts` with the folder system:

- **Colors** (HSL tokens): white canvas `#FFFFFF`, paper `#FAFAFB`, ink `#14162B`, ink-soft `#6B6E85`, line `#ECEDF2`. Blue scale `blue-50 → blue-900` (500 = `#3D63FF`). Yellow scale (500 = `#FFC93C`). Accent scatter: coral `#FF6B4A`, violet `#8B5CF6`, mint `#22C08E`, pink `#FF5FA2`, sky `#3D9BFF` — **restricted to reference-material components only**.
- **Radius**: `--r-chip 8`, `--r-field 12`, `--r-folder 16`, `--r-pill 100`.
- **Spacing**: 4/8/12/20/32/56/96.
- **Typography**: Plus Jakarta Sans (400–800) via Google Fonts in `index.html`; JetBrains Mono for small system labels/eyebrows only. Retire Outfit/Inter.
- **Motion rules** codified as reusable keyframes: `folder-settle` (1.00 → 1.04 → 1.00, no rotation), `yellow-flash` (single 600ms pulse, non-loopable), `reference-align` (rotate + scale jitter → 0/1.0).

### 2. Core Folder component system

New folder under `src/components/marketing/folder/`:

- **`BrandFolder.tsx`** — reusable SVG/CSS folder. Props: `color` (hex), `name`, `logoUrl`, `palette` (2–3 hex), `state` ('empty' | 'receiving' | 'active' | 'client'), `size`. Renders: gradient body in brand color, tab, two paper edges peeking behind, rounded-square logo slot (letter fallback), row of palette dots, name label below.
- **`ReferenceCard.tsx`** — sharp-cornered thumbnail with random tilt (−6° to +6°), scatter-color border/tag. The only sharp corners in the system.
- **`FolderTab.tsx`** — nav-tab variant of the folder shape, used by `MarketingLayout` for the active-page indicator.
- **`ClaimFlash.tsx`** — wrapper that plays the once-only yellow flash when a child element enters "claimed" state.

### 3. MarketingLayout rework

`src/components/marketing/MarketingLayout.tsx`:

- Sticky white/blur nav, max-width 1180px.
- Logo lockup: small folder mark + "BDesign" wordmark, "by Because" secondary.
- Nav items rendered as **folder tabs** — the active tab sits ~4px forward with the folder-tab shape; inactive items are plain text. Words only, no icons.
- CTA: pill button, blue-500 fill, subtle blue glow shadow.
- Footer keeps current information but restyled with the new tokens (pill links, folder-mark logo, dashed "add a brand" motif in the contact block).

### 4. Homepage (`Home.tsx`) — folder-native, seven sections

Order locked to the positioning brief:

1. **Hero — "What is this?"**
   Left: eyebrow chip ("Built by Because"), H1 "The internet is <span>yours</span> now." (yellow highlight flashes once on load), sub "See it. Steal it. Brand it.", two pill CTAs.
   Right: **hero folder composition** — one large `BrandFolder` (blue, "Your brand"), 4–5 `ReferenceCard`s floating around it with scatter colors and tilt, gently drifting toward the folder on scroll (Framer Motion, `useScroll` transforms — no scroll-hijack).

2. **Recognition — "Is this for me?"**
   Full-bleed paragraph: the screenshot-folder-everyone-has line. Behind it, a soft mosaic of tilted reference cards (scatter colors) with low opacity.

3. **Mechanism — "Will this embarrass me?"**
   Two-column: left = the strip-before-rebuild copy in three short beats; right = **THEIRS → YOURS hover demo**. Hover a reference card → it slides into the folder → yellow flash → emerges as a branded creative card (blue border, logo badge, palette dots). CSS `:hover` + Framer Motion `layoutId` for the transition. Reduced-motion fallback: side-by-side static.

4. **The re-prompting problem — "Will this become a chore?"**
   Split card: left = a fake "ChatGPT chat" showing repeat brand-context pasting, muted greys; right = the same task in BDesign, one click, brand folder pre-loaded. Direct, no jokes.

5. **Proof — "Show me"**
   Real before/after gallery using the JPGs from the uploaded zip. Each pair rendered as `ReferenceCard` (left) → `BrandFolder`-tinted output card (right), with a small "claimed" chip in yellow between them.

6. **Built for teams — "Does this fit how I work?"**
   Two folder groups side-by-side. Solo = one blue folder. Agency = a grid of ~6 folders in different client colors (with logo badges + palette dots) — the actual dashboard preview.

7. **Pricing shape + Close**
   Four pill-cards (Creator / Business / Agency / Enterprise), tier name + one line each, ₹ figures kept as `[price]` placeholders. Single repeated primary CTA below: "Request access".

### 5. Inner marketing pages

Same voice, same folder object, tightened for scannability.

- **Features.tsx** — hero + feature blocks organized as "folders" (each feature is a mini folder card with a title and 2–3 lines). Reuse `BrandFolder` in `empty`/`active` states as section markers.
- **How it works** (new section on Features or its own `HowItWorks.tsx` route added to `App.tsx` + `MarketingLayout` nav — TBD in build): three scroll steps using the folder as the through-line: (1) empty brand folder appears with brand name label; (2) a `ReferenceCard` drops into it; (3) the same card exits as a branded creative — yellow flash once at step 3.
- **Pricing.tsx** — four pill-cards, folder-mark next to each tier name, ₹ placeholders retained.
- **About.tsx** — keep Because narrative; add a small folder-grid "brands we've worked with" using letter-fallback logos.
- **FAQ.tsx** — accordion restyled with folder-tab headers.
- **Contact.tsx** — restyle only (tokens, pill inputs); content unchanged.
- **Trust.tsx** — restyle only.

### 6. SEO / assets / cleanup

- Update `SEO.tsx` defaults — SITE_URL stays `https://autodesigner.lovable.app` (custom domain not yet cut over — flag as TBD if user wants `bdesign.teambecause.com` swapped now).
- `index.html`: preconnect + link Plus Jakarta Sans and JetBrains Mono; keep existing title/description written last turn.
- Retire any Outfit/Inter references in `tailwind.config.ts` and swap `font-display`/`font-sans` to Plus Jakarta.
- New `logo-icon.png` not required — the folder mark is CSS/SVG. `og-image.jpg` reused for now; a new folder-hero OG image can be generated in a follow-up if wanted.

### 7. Motion & accessibility

- All motion via Framer Motion (already in stack). `viewport={{ once: true }}` everywhere.
- `prefers-reduced-motion`: yellow flash becomes an instant static yellow underline; reference-card drift and hover demo become static layouts.
- Nav folder-tab keyboard focus ring in blue-500; contrast checked against white.

---

### Technical notes

- Framer Motion is already installed; no new packages required.
- Zero backend/schema changes. Zero edge-function changes.
- All existing marketing routes and paths preserved; only visual + a possible new `/how-it-works` route (confirm before adding).
- Uploaded HTMLs are used only as loose inspiration — the final build follows this spec, not those files, and the folder component is built properly in React with tokens (not the inline styles from the HTML).

### Out of scope this pass

- In-product Dashboard/Brand Hub folder redesign (spec-ready but explicitly separate; the folder component built here is reusable when we move into the app).
- Chrome extension hover mode.
- Manual text overlay tool.
- Custom domain switch.
- Backfilling old copy on inner pages beyond restyling — content stays as written last turn unless you flag specifics.

### Open questions before build

1. **Add a dedicated `/how-it-works` route**, or keep the three-step folder sequence as a section inside Home + Features?
2. **Swap SITE_URL to `bdesign.teambecause.com`** now, or leave `autodesigner.lovable.app` until DNS is cut?
3. **New OG hero image** (folder composition) generated this pass, or reuse existing `og-image.jpg`?

# MakeMyAd — Client Documentation PDF

I'll generate a single polished PDF (`/mnt/documents/MakeMyAd_Architecture_Overview.pdf`) you can hand to a client. No code in the app will change — this is a one-off document.

## What the PDF will cover

**1. Cover + Executive Summary**
- What MakeMyAd is, who it's for (marketing agencies), the one-line pitch.

**2. The Pitch — Why this beats "just use ChatGPT"**
- Brand memory: every brand's logo, palette, voice, nevers, tagged assets are stored and re-applied automatically.
- Reference-to-brand workflow: paste a competitor ad, get *your* brand's version in seconds — not a generic image.
- Multi-asset enforcement: logo + 3D architecture + mascot composited correctly, not hallucinated.
- Credit system, history, multi-account hub, Chrome extension — workflow tooling ChatGPT doesn't have.
- Output is on-brand, agency-ready, in the right aspect ratio, every time.

**3. Technology Stack**
- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Router + TanStack Query.
- Backend (Lovable Cloud): Postgres + Auth + Storage + Edge Functions (Deno).
- AI layer: kie.ai gateway → Nano Banana Pro (image gen) + GPT-5.4 (brief reasoning).
- Chrome Extension (MV3) for in-browser context-menu generation.

**4. End-to-End Architecture Diagram (ASCII)**
- Browser ↔ React app ↔ Supabase Auth/DB/Storage ↔ Edge Functions ↔ kie.ai (Banana + GPT).

**5. Core User Flows (step-by-step)**
- Auth & account switching
- Brand setup (Paste & Parse + Master Prompt)
- Generation flow (reference → brief reasoning → image gen → storage → history)
- Admin flows (user creation, credit grants, global history)
- Extension flow (right-click image → generate)

**6. API Calls Inventory**
For each Edge Function: purpose, trigger, external APIs called, credits consumed, typical latency.
- `generate-creative` — the main one (GPT-5.4 brief pass + Banana Pro image, 1 credit)
- `brand-autofill`
- `admin-create-user`
- `admin-reset-password`
- `recover-generation`
- `sweep-stuck-generations`

**7. Code File Map**
Walkthrough of every important file, grouped by purpose:
- Routing & layout (`App.tsx`, `DashboardLayout.tsx`, `AppSidebar.tsx`)
- Auth (`useAuth.tsx`, `accountVault.ts`, `ProtectedRoute.tsx`)
- Brand hub (`BrandHub.tsx`, `BrandForm.tsx`, `PasteParseWizard.tsx`, `brandParser.ts`)
- Studio (`Studio.tsx` + generation pipeline)
- History (`History.tsx`)
- Admin (`AdminDashboard/Users/Brands/Logs/History.tsx`)
- Marketing site (`pages/marketing/*`)
- Edge functions (`supabase/functions/*`)
- Extension (`extension/*`)

**8. Database Schema Overview**
Tables: `brands`, `brand_assets`, `generations`, `user_credits`, `user_roles`, `profiles`, `activity_logs` — with relationships and RLS approach.

**9. Security Model**
- Row-Level Security on every table
- Roles in separate `user_roles` table with `has_role()` security-definer function
- Server-side credit deduction, no client trust

**10. Pricing / Cost Model (per generation)**
- 1 credit per generation; underlying cost = GPT-5.4 brief tokens + Banana Pro image call.

**11. Roadmap-ready appendix**
- Where to extend (new industries, new placement rules, video, etc.).

## How I'll build it

- Use Python + ReportLab to lay out a branded PDF (MakeMyAd Clean Futurism palette: #2563EB primary, #E5B800 accent, Outfit-style headings).
- Pull real file paths and counts from the repo so the document is accurate, not generic.
- ASCII architecture diagram inside a monospace code block.
- QA every page as images before delivering, fix any overflow/layout issues, then drop the final `.pdf` in `/mnt/documents/` with a `<presentation-artifact>` link.

Estimated length: ~14–20 pages.

Approve and I'll generate it.

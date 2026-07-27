# Codebase Architecture Audit

Read-only review. Nothing was modified. Numbers below come directly from the current tree (`13,489` LOC across `100` TS/TSX files; `3,440` LOC across 6 edge functions).

---

## 1. Snapshot — where the weight sits

**Top-heavy files (should be the first thing you notice):**

| File | LOC | Concern |
|---|---:|---|
| `supabase/functions/generate-creative/index.ts` | **2,584** | Entire pipeline (Kie client, Lovable client, framework analysis, adapt, render, moods, prompt builders, HTTP handler, worker) in one file |
| `src/pages/BrandForm.tsx` | **917** | UI + data fetching + storage uploads + validation + categorization + parsing all inline |
| `src/pages/Studio.tsx` | **780** | UI + realtime subscriptions + upload + generation orchestration + polling + result rendering |
| `src/pages/BrandHub.tsx` | 759 | UI + queries + campaign grouping logic |
| `src/pages/AdminUsers.tsx` | 568 | UI + admin RPCs + role management |

Everything else is under 450 LOC and mostly fine. The problem is concentrated in **5 files**.

---

## 2. Findings by category

### 2.1 Separation of concerns — the main issue

Every page in `src/pages/` calls `supabase.*` directly (12 of 12 pages). There is no data-access layer. Symptoms:

- **`Studio.tsx`** mixes: file upload to Storage, insert into `generations`, realtime channel subscription, function invocation, polling fallback (`recover-generation`), progress state machine, image download for "Save PNG", and the entire UI. Any change to the pipeline touches UI code.
- **`BrandForm.tsx`** mixes: 900+ lines of form state (15+ `useState`), inline `INDUSTRY_CATEGORIES` taxonomy, storage upload/delete, brand+assets insert/update sequencing, and rendering. The taxonomy (`BASE_CATEGORIES`, `INDUSTRY_CATEGORIES`, lines 24–95) is domain data that belongs in `src/lib/`, not in a form component.
- **`History.tsx` / `AdminHistory.tsx`** duplicate the infinite-query + filter pattern. Same shape, two implementations.
- **`AppSidebar.tsx`** queries the DB for role/branding. Sidebar shouldn't own data fetching — a hook should.

**Root cause:** no `src/services/` or `src/api/` boundary. Pages import `supabase` and hand-roll queries. This is the single highest-leverage refactor.

### 2.2 `generate-creative/index.ts` — 2,584-line monolith

One file contains ~15 responsibilities that map cleanly to modules:

```text
generate-creative/
  index.ts                → HTTP handler + worker only
  clients/kie.ts          → kieChat, kieResponses, kieGenerateImage, error mapping
  clients/lovable.ts      → lovableChat, image-safety helpers
  pipeline/analyze.ts     → analyzeFramework + framework parsing/sanitization
  pipeline/adapt.ts       → adaptDirective + directive parsing
  pipeline/render.ts      → generateCreative (image render + retries)
  pipeline/moods.ts       → CREATIVE_MOODS + deriveBrandMoods + pickMoodFromAllowed
  pipeline/fallbacks.ts   → buildLocalDirectiveFallback + buildLocalFrameworkFallback
  prompts/*.ts            → buildDirectivePrompt, buildFallbackPrompt, system prompts
  utils/images.ts         → extractPngDimensions, extractJpegDimensions, isAspectRatioMatch
  utils/text.ts           → toCompactText, splitNevers, extractExampleCopy
```

Concrete complexity smells here:
- Constants and helpers interleaved with async orchestration (dimension parsers on line 50 sit above the HTTP handler at 2179).
- Three JSON-extraction paths (`extractFrameworkFromContent`, `extractDirectiveFromContent`, `candidateJsonBlocks`) — extract to one shared `parseJsonyLLMOutput` utility.
- `ASSET_ROLE_INSTRUCTIONS` (line 1409) and `NORM_ZONE_MAP` (line 97) are prompt-engineering data that should live in `prompts/` beside the prompts that use them.

### 2.3 Duplication

- **`src/hooks/use-toast.ts` and `src/components/ui/use-toast.ts`** are the same file (184 lines each). shadcn ships a re-export shim; you have two copies. Consumers may import either — hard to track.
- **`src/lib/types.ts`** defines `Brand` and `BrandAsset` by hand. `src/integrations/supabase/types.ts` already generates authoritative types from the schema. The hand-written ones will drift (they're missing `industry`, `campaign_id`, `extra_colors`, `never_visual`, `never_content` — all fields the code actually uses).
- Storage bucket string `"brand-assets"` is hardcoded in `BrandForm`, `Studio`, `BrandHub` and (probably) admin pages. Same for the `"generations"`, `"brands"`, `"campaigns"` table names — no central constants.

### 2.4 Hook boundary is thin

`src/hooks/` has 5 files. Missing hooks that would remove hundreds of lines from pages:
- `useBrands()`, `useBrand(id)`, `useSaveBrand()`, `useBrandAssets(id)`
- `useGenerations({ filter })` — used differently by `History`, `AdminHistory`, `Dashboard`
- `useGenerationRun()` — encapsulates the Studio upload → invoke → realtime → polling flow
- `useCampaigns()`
- `useAdminUsers()` — currently inlined in `AdminUsers.tsx`

### 2.5 Types & contracts

- `Brand` in `src/lib/types.ts` (11 fields) vs `Database["public"]["Tables"]["brands"]` (many more) — the local type is a stale subset.
- `GenerationResult` is defined inline in `Studio.tsx` (line 57). Any other page displaying a generation redefines its own shape.
- The pipeline's `CreativeDirective` type lives inside `generate-creative/index.ts` but conceptually is a contract between the edge function and any future admin surface — belongs in `supabase/functions/_shared/`.

### 2.6 Missing `_shared/` in edge functions

Every function re-implements CORS, JWT extraction, and `supabase-admin` client creation. `brand-autofill/index.ts` (420 LOC) and `generate-creative/index.ts` both have their own SSRF guards, their own header parsers, their own error responders. A `supabase/functions/_shared/{cors,auth,http,ssrf}.ts` set would remove ~150 LOC of duplication and make the security posture centrally auditable.

### 2.7 Marketing vs app split — good, with one gap

The `src/components/marketing/` split is clean. The gap: `src/pages/marketing/` is a flat folder of 7 files, while the app pages are also flat in `src/pages/`. Suggest promoting the split to top-level: `src/pages/marketing/` (done), `src/pages/app/`, `src/pages/admin/`. Right now `AdminHistory.tsx` sits next to `Dashboard.tsx` next to `Login.tsx` — different audiences, same folder.

### 2.8 Testing surface

Only `src/test/example.test.ts` exists. `brandParser.ts`, `brandHealth.ts`, the prompt builders, `sanitizeFramework`, and the JSON extractors are pure functions — high-value, zero-cost to unit-test. Their absence isn't a bug, but it's the reason regressions in the generation pipeline are only caught by running real generations.

### 2.9 Smaller items

- `src/lib/utils.ts` is 6 LOC (just `cn`). Fine, but the naming implies more will be dumped there. Consider `src/lib/tailwind.ts` and reserve `lib/` for domain modules.
- `src/integrations/lovable/index.ts` is auto-generated but imports `supabase` and mutates its session — worth a comment noting this cross-integration coupling.
- `voiceRules`, `visualNevers`, `contentNevers`, `legacyNevers` in `BrandForm` (line 122–125) hint that the "nevers" concept is under-modeled — a `NeverRules` type/parser in `src/lib/brandRules.ts` would make the back-compat migration explicit.

---

## 3. Recommendations — ordered by impact

### Critical (do these first — every future feature is faster after)

1. **Introduce a data-access layer.** Create `src/services/{brands,generations,campaigns,admin,storage}.ts`. Every `supabase.*` call from pages moves in. Then wrap in `src/hooks/queries/*` (React Query). Expected: `Studio.tsx` drops from 780 → ~350 LOC; `BrandForm.tsx` from 917 → ~450.

2. **Break up `generate-creative/index.ts`.** Split into the module tree in §2.2. No behavior change — same exports from `index.ts`. Enables actually testing the pipeline stages and makes the "which model does what" question answerable by reading a folder listing.

3. **Kill the duplicate `use-toast.ts`.** Delete `src/components/ui/use-toast.ts` (or make it a one-line re-export). Pick one canonical import path.

4. **Delete `src/lib/types.ts` and use generated types.** Replace `Brand`, `BrandAsset` usages with `Database["public"]["Tables"]["brands"]["Row"]` (or a `type Brand = Tables<"brands">` alias in a single `src/lib/db.ts`). Prevents silent schema drift.

### High (structural cleanup, no behavior change)

5. **Extract shared edge-function utilities.** Create `supabase/functions/_shared/{cors,auth,ssrf,errors,supabase-admin}.ts`. Migrate all 6 functions to consume them. Centralizes JWT verification and SSRF policy.

6. **Move domain data out of `BrandForm.tsx`.** `INDUSTRY_CATEGORIES`, `BASE_CATEGORIES`, `getAssetCategories` → `src/lib/industries.ts`. Never-rules parsing → `src/lib/brandRules.ts`.

7. **Extract `useGenerationRun()` hook from `Studio.tsx`.** Encapsulates: upload reference → insert generation row → invoke edge function → subscribe to realtime → poll `recover-generation` → normalize result. UI becomes a presenter.

8. **Deduplicate History patterns.** `useGenerations({ scope: "self" | "global", filters })` used by both `History.tsx` and `AdminHistory.tsx`. Single infinite-query + filter component (`<GenerationHistoryList/>`).

9. **Sub-folder pages by audience.** `src/pages/app/*`, `src/pages/admin/*`, keep `src/pages/marketing/*`. Update `App.tsx` imports.

### Medium (quality of life)

10. **Constants file for tables and buckets.** `src/lib/db.ts` exports `TABLES` and `BUCKETS` enums. Removes ~30 magic strings.

11. **Promote shared contracts.** Move `CreativeDirective`, `Framework`, `GenerationStatus` types into `supabase/functions/_shared/contracts.ts` and re-export from `src/lib/contracts.ts` (Deno + Vite friendly).

12. **Component-tier `<BrandCard/>`, `<GenerationCard/>`, `<AssetTile/>`.** These shapes are rebuilt inline across Dashboard, BrandHub, History, Admin*. One component each, reused.

13. **Split `AppSidebar.tsx`** into `AppSidebar` (presentation) + `useSidebarBranding()` (data).

### Optional (nice to have)

14. **Unit tests for pure functions.** `sanitizeFramework`, `extractFrameworkFromContent`, `deriveBrandMoods`, `splitNevers`, `brandParser.ts`, `brandHealth.ts`. Fastest ROI on test coverage.

15. **`src/features/` layout (feature-first).** Once services + hooks exist, group by feature: `src/features/{brand-hub,studio,history,admin,marketing}/{components,hooks,services}`. Only worth doing after step 1 lands.

16. **JSDoc the edge-function pipeline stages** — one paragraph per module explaining input contract, model used, fallback chain. Rescues the "how does the system work" question from the code itself.

17. **Consider Zod schemas at trust boundaries** — edge-function request bodies, LLM JSON outputs. Would replace the hand-rolled `isValidFramework` + `parseStoredFramework` + `ensureFrameworkShape` chain in one shot.

---

## 4. What is already good

- Clean auth/routing shell in `App.tsx` — small, readable, correct role guards.
- `src/components/marketing/folder/*` is well-scoped (small, presentational, no data).
- `src/hooks/useAuth.tsx`, `useIsAdmin.ts` are the right shape — more hooks should look like these.
- Edge functions correctly use RLS + server-side role checks, and `try_consume_credit` is atomic. Security posture doesn't need structural changes, just the shared utilities in §3.5.
- Marketing pages don't leak into app code and vice versa.

---

## 5. Suggested first PR (if you take this on)

Bundle steps **1 + 3 + 4** together. They are the highest-leverage, lowest-risk changes and unblock everything else. Steps **2 + 5** (edge-function split) go in a second PR because they touch a different codebase (Deno vs Vite).

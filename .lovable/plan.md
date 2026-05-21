# Revised strategy — keep kie primary, add resilient fallback, don't constrain the brain

## Guiding principles (from your feedback)

1. **kie stays primary** for all reasoning stages — it's cheaper and, when healthy, has been producing the quality we want.
2. **Lovable AI Gateway is the fallback only** — kicks in when kie times out or returns malformed output.
3. **Do not change how the system thinks.** No new rules, no new constraints, no prompt rewrites that narrow the model's freedom. The Organic Layout Derivation philosophy stays intact (`mem://features/studio/design-philosophy`).
4. **Skip Phase 3 for now.** The asset/logo/brief rules already exist in memory and prompts — when the brain is healthy, they get applied. Tightening them further risks over-constraining.

## What we actually change

### Phase 1 — Add Lovable AI Gateway as fallback for reasoning stages

For each of the 3 reasoning stages, the call order becomes:

```text
Framework Analysis:
  1. kie.ai gemini-3-flash         (primary, current behavior)
  2. kie.ai gemini-3-flash retry   (current retry, kept)
  3. Lovable AI google/gemini-2.5-pro   (NEW fallback)
  4. → only if all 3 fail, hard-fail (Phase 2)

Mood Selection:
  1. kie.ai gemini-3-flash         (primary)
  2. Lovable AI google/gemini-2.5-flash-lite   (NEW fallback)
  3. → if both fail, default to first mood in pool (current behavior, low impact)

Adapt / Directive:
  1. kie.ai gemini-3-flash         (primary)
  2. kie.ai gemini-3-flash retry   (current retry, kept)
  3. Lovable AI google/gemini-2.5-pro   (NEW fallback)
  4. → only if all fail, hard-fail (Phase 2)
```

Key points:
- **Same prompts, same tool-calling schemas, same system messages** sent to both providers. The fallback is a transport swap, not a logic swap.
- **Same model family** (Gemini) on the fallback so output character stays consistent.
- kie pricing is preserved on the happy path. Lovable AI only gets billed when kie is actually down.

### Phase 2 — Stop silent fallback to generic templates

Today, when both Framework and Adapt fail, the code falls back to a hardcoded generic 6-zone template + bland copy, charges the credit, and ships a degraded image. This is what's been producing the "bland, off-brand" outputs this week.

New behavior:
- If Framework Analysis fails on kie primary + kie retry + Lovable AI fallback → **hard-fail the generation, refund the credit, surface "AI is temporarily degraded, please retry" toast.**
- Same for Adapt / Directive.
- Mood selection failure is fine to default — it's a low-impact pick-one task.

The hardcoded fallback framework / fallback directive code paths get removed. Either we have a real reasoned output, or we tell the user and refund. No more silent quality drops.

### Phase 3 — Skipped (per your call)

The reference-isolation, logo force-inclusion, asset cap, brief priority, and mood rotation rules are already in the codebase and memory. Leave them. Once Phase 1+2 are in, these rules will start running again as designed — they were being bypassed by the silent fallback, not weakened.

## What this fixes, mapped to your asks

| Concern | How it gets fixed without constraining the system |
|---|---|
| Thinking quality | When kie's reasoning endpoint times out, Gemini 2.5 Pro on Lovable AI takes the same prompt and produces a real reasoned output instead of the hardcoded generic template. |
| Design quality | Framework Analysis actually runs to completion → real reference-derived blueprint, not a generic 6-zone fallback. |
| Creativity | Mood rotation + Adapt's copywriting freedom both stay intact — they just stop being skipped. |
| Reference understanding | Same prompts, same memory rules; the model that reads the reference is just guaranteed to actually run. |
| Asset & logo handling | Adapt stage runs to completion → asset selection and logo force-inclusion logic actually executes. |
| Brand-line adaptation | Brand brief and voice rules flow through unchanged; the Adapt model just stops being bypassed. |

## Technical scope

**Files touched:**
- `supabase/functions/generate-creative/index.ts` — add a `callLovableAI()` helper, add fallback branch after kie retries in `analyzeFramework()` and `adaptDirective()` (and optionally `selectMood()`), remove the two hardcoded fallback template/directive blocks, replace with hard-fail + credit-refund path.

**No changes to:**
- Frontend (Studio, History, BrandHub) — UX unchanged.
- Database schema — same `generations` table.
- Image generation path — kie nano-banana-pro / banana-2 stays exactly as is.
- System prompts / tool schemas / memory rules — unchanged.
- Brand data, asset uploads, RLS, auth.

**Secrets:** `LOVABLE_API_KEY` already present. `KIE_API_KEY` already present. Nothing to add.

**Cost impact:** Near zero on the happy path (kie still primary). Lovable AI only billed when kie's chat endpoint is degraded — which is exactly the scenario where we'd rather pay a few cents than ship a bad ad.

**Risk:** Low. We're adding a safety net under existing behavior, not replacing it.

## Rollout

1. Implement Phase 1 + Phase 2 together in one edge function update — they must ship together (fallback without hard-fail would just hide future degradations again, hard-fail without fallback would raise the failure rate).
2. Test against the brands that were producing weak outputs today (Vaikunth Copy, Kalrav Alpine, Jaazzoo) — confirm that when kie is healthy, behavior is identical; and that when we simulate a kie timeout, Lovable AI fallback produces a real reasoned output of comparable character.
3. Watch failure rate for 24h — expect today's ~12% failures to drop close to baseline ~3%, with the difference now coming through Lovable AI fallback instead of silent bland outputs.

## What I need from you to proceed

Just a "go" — no decisions, no secrets, no design questions. The plan stays inside the `generate-creative` edge function and changes no UX, no prompts, no rules.

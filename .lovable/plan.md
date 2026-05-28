# Plan: Restore generation quality (forward, not backward)

Combines the drafted reliability plan with stronger reference-vs-brand prompt isolation. Reference still flows into the final image render as a layout guide; we just make it impossible for the renderer to confuse reference subjects with brand subjects.

All changes are scoped to `supabase/functions/generate-creative/index.ts`. No frontend, schema, auth, or memory-rule changes.

---

## Phase 1 — Lovable AI Gateway as fallback (kie stays primary)

For each reasoning stage, add a third tier after the existing kie attempts:

```text
Framework Analysis:
  1. kie.ai gemini-3-flash            (primary, unchanged)
  2. kie.ai gemini-3-flash retry      (unchanged)
  3. Lovable AI google/gemini-2.5-pro (NEW fallback)

Mood Selection:
  1. kie.ai gemini-3-flash            (primary)
  2. Lovable AI gemini-2.5-flash-lite (NEW fallback)
  3. Default to first mood in pool    (low-impact safety net, kept)

Adapt / Directive:
  1. kie.ai gemini-3-flash            (primary)
  2. kie.ai gemini-3-flash retry      (unchanged)
  3. Lovable AI google/gemini-2.5-pro (NEW fallback)
```

Same prompts, same tool-call schemas, same system messages on both providers — fallback is a transport swap only. Same model family (Gemini) on fallback so output character stays consistent. kie pricing preserved on happy path; Lovable AI only billed when kie is degraded.

## Phase 2 — Remove silent hardcoded fallbacks; hard-fail + refund instead

Today, when Framework or Adapt fail, the code drops to a hardcoded generic 6-zone template + bland directive, **charges the credit, ships a degraded image**. This is what's been producing the off-brand, bland outputs.

New behavior:
- Framework Analysis fails on all 3 tiers → **abort generation, refund the credit, return error "AI is temporarily degraded, please retry"**.
- Adapt / Directive fails on all 3 tiers → same.
- Mood selection failure is fine to default — low-impact pick-one task.
- Delete the hardcoded fallback framework block and the hardcoded fallback directive block.

Frontend already surfaces edge function errors as toasts — no UI work needed.

## Phase 3 — Harden reference-vs-brand isolation in the render prompt

Reference image stays in the final `image_input` list as a **layout/composition guide only** — not removed. We strengthen the prompt language sent to the image model so it stops copying reference subjects:

1. **Explicit role labels** in the render prompt header:
   - "Image 1 = REFERENCE (use for layout, composition, zoning, type hierarchy ONLY — never reuse its subjects, characters, locations, pricing, logos, or text)."
   - "Image 2 = BRAND LOGO (must appear in output)."
   - "Images 3..N = BRAND ASSETS (the ONLY allowed visual subjects)."

2. **Anti-leak directive** appended to the render prompt:
   - "All people, buildings, products, mascots, and graphic elements in the output MUST come from Images 2..N. Do NOT depict any person, place, product, or text that appears in Image 1."
   - "Treat Image 1 as a wireframe overlay would be treated — read its structure, ignore its content."

3. **Negative list injection** — re-emphasize existing memory rules (`reference-guidelines`, `content-isolation-policy`, `image-role-labeling`) inline at render time, since they were being bypassed when Adapt silently fell back to the generic directive.

4. **Asset selection hardening**:
   - De-duplicate selected asset indices before building the render prompt.
   - Keep logo force-inclusion regex (`logo-reliability` memory) intact.
   - Validate that at least the logo + 1 brand asset are present before sending to render.

No new memory rules, no new UI controls, no new prompts written from scratch — this is reinforcement of rules that already exist but were being skipped by the silent template fallback.

## Phase 4 — Stage timing logs (for ongoing visibility)

Add structured console logs at start/end of each stage with elapsed ms:
`[Timing] framework_analysis: kie_attempt_1=8421ms ok` etc.
So next time something gets slow, edge function logs immediately show where.

---

## Technical scope

**File touched:** `supabase/functions/generate-creative/index.ts` only.

**Helpers added:**
- `callLovableAI(messages, model, tools?)` — Gemini-equivalent request shape.
- Reusable wrappers `runFrameworkAnalysis()` and `runAdaptDirective()` with the 3-tier escalation.
- `refundCredit(userId, generationId)` — increments credit, marks generation as `failed_refunded`.

**Removed:**
- Hardcoded `FALLBACK_FRAMEWORK` block.
- Hardcoded `FALLBACK_DIRECTIVE` block.

**Unchanged:**
- Frontend (Studio, History, BrandHub).
- Database schema and RLS.
- kie nano-banana-pro / banana-2 image-generation path.
- All memory rules and existing system prompts.
- Brand data, asset uploads, auth.

**Secrets:** `KIE_API_KEY` and `LOVABLE_API_KEY` are already configured. Nothing to add.

**Cost:** Near zero on happy path. Lovable AI only billed when kie is degraded.

**Risk:** Low. Safety net added under existing behavior; refund means users are never charged for a bad output.

---

## Rollout

1. Ship Phases 1–4 together in one edge function deploy (Phase 1 and 2 MUST ship together — fallback without hard-fail just hides degradations again; hard-fail without fallback raises failure rate).
2. Test against the brands that produced weak outputs this week (Vaikunth Copy, Kalrav Alpine, Jaazzoo) — verify identical behavior when kie is healthy; verify reasoned (not generic) output when we simulate a kie timeout.
3. Verify a reference with strong subjects (e.g., a competitor ad with people/products) no longer leaks those subjects into the rendered output.
4. Watch logs for 24h — expect failure rate to drop near baseline ~3%, with most former silent-failures now flowing through Lovable AI fallback instead.

## What I need from you

A "go" to implement. No new secrets, no design questions, no UX changes.

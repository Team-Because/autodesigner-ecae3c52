import { describe, it, expect } from "vitest";
import { scoreBrandHealth, deriveBrandMoods, CREATIVE_MOODS } from "@/lib/brandHealth";

const EMPTY_BRAND = {
  hasLogo: false,
  taggedAssetCount: 0,
  briefIdentity: "",
  briefVisual: "",
  voiceRules: "",
  visualNevers: "",
  contentNevers: "",
  industry: null,
};

describe("scoreBrandHealth", () => {
  it("returns 0 sparse when nothing is filled in", () => {
    const r = scoreBrandHealth(EMPTY_BRAND);
    expect(r.score).toBe(0);
    expect(r.level).toBe("sparse");
    expect(r.color).toBe("destructive");
  });

  it("awards partial credit for below-threshold signals", () => {
    const r = scoreBrandHealth({
      ...EMPTY_BRAND,
      hasLogo: true, // +15
      taggedAssetCount: 1, // +10 (below 3-threshold)
      briefIdentity: "a".repeat(120), // +8
      briefVisual: "b".repeat(200), // +10
      voiceRules: "c".repeat(60), // +8
      industry: "Real Estate", // +5
    });
    // Nevers still empty (+0)
    expect(r.score).toBe(15 + 10 + 8 + 10 + 8 + 5);
    expect(r.level).toBe("partial");
    expect(r.color).toBe("warning");
  });

  it("reaches success at 70+ once thresholds are met", () => {
    const r = scoreBrandHealth({
      hasLogo: true,
      taggedAssetCount: 5,
      briefIdentity: "a".repeat(400),
      briefVisual: "b".repeat(500),
      voiceRules: "c".repeat(200),
      visualNevers: "no purple",
      contentNevers: "no discounts",
      industry: "Real Estate",
    });
    expect(r.score).toBe(100);
    expect(r.level).toBe("filled");
    expect(r.color).toBe("success");
  });
});

describe("deriveBrandMoods", () => {
  it("returns every brand-safe mood when there's no tone signal", () => {
    const { allowed, reason } = deriveBrandMoods("", "", "");
    expect(allowed.length).toBe(CREATIVE_MOODS.length);
    expect(reason).toMatch(/no tone signal/);
  });

  it("disqualifies a mood when its forbidden trait is in the negative list", () => {
    const { allowed } = deriveBrandMoods("", "", "playful, casual");
    const labels = allowed.map((m) => m.label);
    // "Sophisticated & Premium" bans playful/casual — must be gone.
    expect(labels).not.toContain("Sophisticated & Premium");
  });

  it("ranks moods whose traits appear in the brief above unmatched ones", () => {
    const { allowed, reason } = deriveBrandMoods(
      "The brand is bold, confident and authoritative. Strong, powerful voice.",
      "## TONE & VOICE\nbold, confident, decisive",
      "",
    );
    expect(allowed[0].label).toBe("Bold & Confident");
    expect(reason).toMatch(/derived from your tone signals/);
  });
});

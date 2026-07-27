import { describe, it, expect } from "vitest";
import { parseMasterOutput, readNevers, writeNevers } from "@/lib/brandParser";

const SAMPLE = `
## Brand Name
Acme Homes

## Industry
Real Estate

## Color Palette
Primary: #123456 — Deep Ocean
Secondary: #ABCDEF — Sky Mist
Extra:
- Accent Gold #ffcc00
- Cream #fff8e1

## Brand Identity
Acme Homes builds calm, family-first residences in tier-2 India.

## Visual Direction
Warm natural light. Wide angles. Elevation-forward.

## Tone & Voice
Warm, grounded, confident.

## Target Audience
First-time NRI buyers.

## Visual Nevers
- No dark, moody skies
- No neon accents

## Content Nevers
- Never promise "guaranteed appreciation"

## Asset Tags
- Asset 1 (Logo): Logo
- Asset 2: Elevation
- 3. Interior
`;

describe("parseMasterOutput", () => {
  it("extracts headline fields from a well-formed master prompt", () => {
    const p = parseMasterOutput(SAMPLE);
    expect(p.industry).toBe("Real Estate");
    expect(p.brandName).toBe("Acme Homes");
    expect(p.primaryColor).toBe("#123456");
    expect(p.secondaryColor).toBe("#abcdef");
    expect(p.extraColors.map((c) => c.hex)).toEqual(["#ffcc00", "#fff8e1"]);
    expect(p.briefIdentity).toMatch(/Acme Homes builds/);
    expect(p.briefVisual).toMatch(/Warm natural light/);
    expect(p.voiceRules).toMatch(/## TONE & VOICE/);
    expect(p.voiceRules).toMatch(/## TARGET AUDIENCE/);
    expect(p.visualNevers).toMatch(/dark, moody/);
    expect(p.contentNevers).toMatch(/guaranteed appreciation/);
  });

  it("parses asset tags in multiple formats", () => {
    const p = parseMasterOutput(SAMPLE);
    expect(p.assetTags).toEqual([
      { index: 1, label: "Logo", tag: "Logo" },
      { index: 2, label: "", tag: "Elevation" },
      { index: 3, label: "", tag: "Interior" },
    ]);
  });

  it("returns null-ish fields when nothing matches", () => {
    const p = parseMasterOutput("just some free text with no headers");
    expect(p.industry).toBeNull();
    expect(p.brandName).toBeNull();
    expect(p.primaryColor).toBeNull();
    expect(p.assetTags).toEqual([]);
  });
});

describe("readNevers / writeNevers round-trip", () => {
  it("splits headered text into visual/content", () => {
    const r = readNevers("## VISUAL NEVERS\nno neon\n\n## CONTENT NEVERS\nno guarantees");
    expect(r.visual).toBe("no neon");
    expect(r.content).toBe("no guarantees");
    expect(r.general).toBe("");
  });

  it("falls back to `general` when there are no headers", () => {
    const r = readNevers("legacy plain text of nevers");
    expect(r.general).toBe("legacy plain text of nevers");
    expect(r.visual).toBe("");
    expect(r.content).toBe("");
  });

  it("writeNevers reserializes to headered form when structured", () => {
    const out = writeNevers("no neon", "no guarantees");
    expect(out).toMatch(/## VISUAL NEVERS\nno neon/);
    expect(out).toMatch(/## CONTENT NEVERS\nno guarantees/);
  });

  it("writeNevers emits legacy text when only general is provided", () => {
    const out = writeNevers("", "", "legacy blob");
    expect(out).toBe("legacy blob");
  });
});

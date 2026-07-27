import { describe, it, expect, vi } from "vitest";

const rows = [
  { brand_id: "a", label: "Logo" },
  { brand_id: "a", label: "Other:" },
  { brand_id: "a", label: "" },
  { brand_id: "b", label: null },
  { brand_id: "b", label: "Mascot" },
];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      select: async () => ({ data: rows, error: null }),
    }),
  },
}));

import { listMyBrandAssetCounts } from "@/services/brandAssets";

describe("listMyBrandAssetCounts", () => {
  it("counts totals and treats empty / 'Other:' / null labels as untagged", async () => {
    const counts = await listMyBrandAssetCounts();
    expect(counts).toEqual({
      a: { total: 3, tagged: 1 },
      b: { total: 2, tagged: 1 },
    });
  });
});

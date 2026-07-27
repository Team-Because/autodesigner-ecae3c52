import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Supabase client BEFORE importing the service under test.
const rpcMock = vi.fn();
const insertMock = vi.fn();
const selectMock = vi.fn();
const eqMock = vi.fn();
const singleMock = vi.fn();
const updateMock = vi.fn();
const orderMock = vi.fn();
const headMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  return {
    supabase: {
      from: (table: string) => ({
        select: (...args: unknown[]) => {
          selectMock(table, ...args);
          const chain = {
            eq: (...a: unknown[]) => {
              eqMock(...a);
              return {
                single: () => singleMock(),
                order: () => orderMock(),
              };
            },
            order: () => orderMock(),
          };
          return chain;
        },
        insert: (payload: unknown) => {
          insertMock(table, payload);
          return {
            select: () => ({ single: () => singleMock() }),
          };
        },
        update: (payload: unknown) => {
          updateMock(table, payload);
          return { eq: (...a: unknown[]) => eqMock(...a) };
        },
      }),
      rpc: (name: string, args: unknown) => rpcMock(name, args),
    },
  };
});

import { mergeBrand } from "@/services/brands";

describe("brands service", () => {
  beforeEach(() => {
    rpcMock.mockReset();
  });

  it("mergeBrand invokes the merge_brand RPC and returns the transfer count", async () => {
    rpcMock.mockResolvedValueOnce({
      data: { creatives_transferred: 7 },
      error: null,
    });

    const result = await mergeBrand("src-id", "dst-id");

    expect(rpcMock).toHaveBeenCalledWith("merge_brand", {
      _source_brand_id: "src-id",
      _destination_brand_id: "dst-id",
    });
    expect(result).toEqual({ creatives_transferred: 7 });
  });

  it("mergeBrand throws when the RPC errors", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: new Error("nope") });
    await expect(mergeBrand("a", "b")).rejects.toThrow("nope");
  });

  it("mergeBrand defaults transferred count to 0 when RPC returns no payload", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    const result = await mergeBrand("a", "b");
    expect(result).toEqual({ creatives_transferred: 0 });
  });
});

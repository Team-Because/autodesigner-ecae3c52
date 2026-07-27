import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  archiveBrand,
  duplicateBrand,
  mergeBrand,
  setBrandCampaign,
  unarchiveBrand,
} from "@/services/brands";
import type { Brand } from "@/lib/db";

/**
 * All brand mutations invalidate the same set of queries so BrandHub / Studio
 * / Dashboard stay in sync automatically after any change.
 */
function useInvalidateBrands() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["brands"] });
    qc.invalidateQueries({ queryKey: ["brands-minimal"] });
  };
}

export function useArchiveBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (id: string) => archiveBrand(id),
    onSuccess: invalidate,
  });
}

export function useUnarchiveBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (id: string) => unarchiveBrand(id),
    onSuccess: invalidate,
  });
}

export function useAssignBrandCampaign() {
  const invalidate = useInvalidateBrands();
  return useMutation({
    mutationFn: (v: { brandId: string; campaignId: string | null }) =>
      setBrandCampaign(v.brandId, v.campaignId),
    onSuccess: invalidate,
  });
}

export function useDuplicateBrand() {
  const invalidate = useInvalidateBrands();
  return useMutation<Brand, Error, { brandId: string; userId: string }>({
    mutationFn: (v) => duplicateBrand(v.brandId, v.userId),
    onSuccess: invalidate,
  });
}

export function useMergeBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { sourceBrandId: string; destinationBrandId: string }) =>
      mergeBrand(v.sourceBrandId, v.destinationBrandId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
      qc.invalidateQueries({ queryKey: ["brands-minimal"] });
      qc.invalidateQueries({ queryKey: ["generations"] });
      qc.invalidateQueries({ queryKey: ["brand-generation-count"] });
    },
  });
}

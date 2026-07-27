import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transferBrandToUser, transferCampaignToUser } from "@/services/admin";

function useInvalidateAdminOwnership() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin-all-brands"] });
    qc.invalidateQueries({ queryKey: ["admin-all-groups"] });
    qc.invalidateQueries({ queryKey: ["admin-all-generations"] });
  };
}

export function useTransferBrand() {
  const invalidate = useInvalidateAdminOwnership();
  return useMutation({
    mutationFn: (v: { brandId: string; targetUserId: string }) =>
      transferBrandToUser(v.brandId, v.targetUserId),
    onSuccess: invalidate,
  });
}

export function useTransferCampaign() {
  const invalidate = useInvalidateAdminOwnership();
  return useMutation({
    mutationFn: (v: { campaignId: string; brandIds: string[]; targetUserId: string }) =>
      transferCampaignToUser(v.campaignId, v.brandIds, v.targetUserId),
    onSuccess: invalidate,
  });
}

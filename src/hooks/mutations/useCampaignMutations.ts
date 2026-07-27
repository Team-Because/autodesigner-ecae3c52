import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCampaign,
  deleteCampaign,
  renameCampaign,
} from "@/services/campaigns";

function useInvalidateCampaigns() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["campaigns"] });
    qc.invalidateQueries({ queryKey: ["brands"] });
  };
}

export function useCreateCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (v: { name: string; userId: string }) =>
      createCampaign(v.name, v.userId),
    onSuccess: invalidate,
  });
}

export function useRenameCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (v: { id: string; name: string }) => renameCampaign(v.id, v.name),
    onSuccess: invalidate,
  });
}

export function useDeleteCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: invalidate,
  });
}

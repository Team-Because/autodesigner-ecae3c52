import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMyBrandAssetCounts } from "@/services/brandAssets";

export function useMyBrandAssetCounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brand-asset-counts", user?.id],
    queryFn: listMyBrandAssetCounts,
    enabled: !!user,
  });
}

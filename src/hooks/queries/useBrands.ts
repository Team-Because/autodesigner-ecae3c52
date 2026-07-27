import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMyActiveBrandsMinimal, listMyBrands } from "@/services/brands";

export function useMyBrands(opts: { activeOnly?: boolean } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brands", user?.id, opts],
    queryFn: () => listMyBrands(opts),
    enabled: !!user,
  });
}

export function useMyActiveBrandsMinimal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["brands-minimal", user?.id],
    queryFn: () => listMyActiveBrandsMinimal(),
    enabled: !!user,
  });
}

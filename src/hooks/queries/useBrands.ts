import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  listMyActiveBrandsMinimal,
  listMyBrands,
  countBrandGenerations,
  getBrand,
} from "@/services/brands";

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

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brand", id],
    queryFn: () => getBrand(id!),
    enabled: !!id,
  });
}

export function useBrandGenerationCount(id: string | null | undefined) {
  return useQuery({
    queryKey: ["brand-generation-count", id],
    queryFn: () => countBrandGenerations(id!),
    enabled: !!id,
  });
}

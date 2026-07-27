import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { hasRole } from "@/services/roles";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: isAdmin = false, isLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => (user ? hasRole(user.id, "admin") : Promise.resolve(false)),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return { isAdmin, isLoading };
}

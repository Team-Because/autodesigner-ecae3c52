import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMyGenerationsMinimal } from "@/services/generations";

export function useMyGenerationsMinimal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["generations", user?.id],
    queryFn: listMyGenerationsMinimal,
    enabled: !!user,
  });
}

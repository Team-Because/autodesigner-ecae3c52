import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMyCredits } from "@/services/credits";

export function useMyCredits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-credits", user?.id],
    queryFn: () => getMyCredits(user!.id),
    enabled: !!user,
  });
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMyCampaigns } from "@/services/campaigns";

export function useMyCampaigns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: listMyCampaigns,
    enabled: !!user,
  });
}

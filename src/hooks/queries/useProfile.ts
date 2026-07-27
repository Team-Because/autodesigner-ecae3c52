import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile, getMyProfileFields } from "@/services/profiles";
import type { Profile } from "@/lib/db";

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: () => getMyProfile(user!.id),
    enabled: !!user,
  });
}

export function useMyProfileFields<K extends keyof Profile>(fields: K[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-profile", user?.id, ...fields],
    queryFn: () => getMyProfileFields(user!.id, fields),
    enabled: !!user,
  });
}

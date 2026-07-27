import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import {
  adminListAllBrands,
  adminListAllCampaigns,
  adminListAllCredits,
  adminListAllGenerations,
  adminListProfiles,
} from "@/services/admin";
import { listRecentActivityLogs } from "@/services/activityLogs";

/**
 * All admin queries share the same gate: the caller must be authenticated
 * AND hold the admin role. Server-side RLS backs this up regardless.
 */
function useAdminGate() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  return { enabled: !!user && isAdmin };
}

export function useAdminProfiles() {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: adminListProfiles,
    enabled,
  });
}

export function useAdminAllBrands(minimal = false) {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-all-brands", { minimal }],
    queryFn: () => adminListAllBrands(minimal),
    enabled,
  });
}

export function useAdminAllCampaigns() {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-all-groups"],
    queryFn: adminListAllCampaigns,
    enabled,
  });
}

export function useAdminAllGenerations() {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-all-generations"],
    queryFn: adminListAllGenerations,
    enabled,
  });
}

export function useAdminCredits() {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-credits"],
    queryFn: adminListAllCredits,
    enabled,
  });
}

export function useAdminActivityLogs(limit = 200) {
  const { enabled } = useAdminGate();
  return useQuery({
    queryKey: ["admin-activity-logs", { limit }],
    queryFn: () => listRecentActivityLogs(limit),
    enabled,
  });
}

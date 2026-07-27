import { useAuth } from "@/hooks/useAuth";
import { useCallback } from "react";
import {
  insertActivityLog,
  type ActivityAction,
  type ActivityEntityType,
} from "@/services/activityLogs";

export function useActivityLog() {
  const { user } = useAuth();

  const log = useCallback(
    async (
      action: ActivityAction,
      entityType: ActivityEntityType,
      entityId?: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!user) return;
      try {
        await insertActivityLog({
          userId: user.id,
          action,
          entityType,
          entityId,
          metadata,
        });
      } catch {
        // Fire-and-forget — don't break UX for logging failures.
      }
    },
    [user],
  );

  return { log };
}

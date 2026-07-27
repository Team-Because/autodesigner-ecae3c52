import { supabase } from "@/integrations/supabase/client";
import { TABLES } from "@/lib/db";

export type ActivityEntityType =
  | "brand"
  | "group"
  | "campaign"
  | "generation"
  | "credit"
  | "user";

export type ActivityAction =
  | "brand.created"
  | "brand.updated"
  | "brand.deleted"
  | "brand.archived"
  | "brand.unarchived"
  | "brand.duplicated"
  | "brand.transferred"
  | "brand.merged"
  | "group.created"
  | "group.renamed"
  | "group.deleted"
  | "group.transferred"
  | "generation.started"
  | "generation.completed"
  | "generation.failed"
  | "credit.assigned"
  | "credit.set"
  | "credit.reset"
  | "user.created"
  | "password.reset";

export interface ActivityLogRow {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export async function insertActivityLog(row: {
  userId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await supabase.from(TABLES.activity_logs).insert({
    user_id: row.userId,
    action: row.action,
    entity_type: row.entityType,
    entity_id: row.entityId ?? null,
    metadata: row.metadata ?? {},
  });
}

export async function listRecentActivityLogs(limit = 200): Promise<ActivityLogRow[]> {
  const { data, error } = await supabase
    .from(TABLES.activity_logs)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ActivityLogRow[]) ?? [];
}

import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { BroadcastTarget } from "@/lib/database.types";

export async function listBroadcasts(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("broadcasts")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBroadcast(
  eventId: string,
  targetType: BroadcastTarget,
  body: string,
  targetGroupIds: string[] | null = null
) {
  const { error } = await supabaseAdmin().from("broadcasts").insert({
    event_id: eventId,
    target_type: targetType,
    body,
    target_group_ids: targetType === "custom" ? targetGroupIds : null,
  });
  if (error) throw error;
}

export async function listBroadcastsForGroup(
  eventId: string,
  groupId: string,
  isUnsubmitted: boolean
) {
  const all = await listBroadcasts(eventId);
  return all.filter(
    (b) =>
      b.target_type === "all" ||
      (b.target_type === "unsubmitted" && isUnsubmitted) ||
      (b.target_type === "custom" && (b.target_group_ids ?? []).includes(groupId))
  );
}

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
  body: string
) {
  const { error } = await supabaseAdmin()
    .from("broadcasts")
    .insert({ event_id: eventId, target_type: targetType, body });
  if (error) throw error;
}

import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";

// cache() で同一リクエスト内の重複呼び出し（layout + page など）を1回のクエリに統合する
export const getEventBySlug = cache(async (slug: string) => {
  const { data, error } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
});

export async function updateEventSettings(
  eventId: string,
  settings: { name: string; adminLabel: string }
) {
  const { error } = await supabaseAdmin()
    .from("events")
    .update({ name: settings.name, admin_label: settings.adminLabel })
    .eq("id", eventId);
  if (error) throw error;
}

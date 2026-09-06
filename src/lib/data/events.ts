import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import type { NavItemConfig, ThemeKey } from "@/lib/database.types";

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

export async function listEvents() {
  const { data, error } = await supabaseAdmin().from("events").select("*");
  if (error) throw error;
  return data ?? [];
}

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

export async function updateEventTheme(eventId: string, theme: ThemeKey) {
  const { error } = await supabaseAdmin().from("events").update({ theme }).eq("id", eventId);
  if (error) throw error;
}

export async function updateEventNavConfig(
  eventId: string,
  side: "admin" | "group",
  config: NavItemConfig[]
) {
  const update =
    side === "admin" ? { admin_nav_config: config } : { group_nav_config: config };
  const { error } = await supabaseAdmin().from("events").update(update).eq("id", eventId);
  if (error) throw error;
}

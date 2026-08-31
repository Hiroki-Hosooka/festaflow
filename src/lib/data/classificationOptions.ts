import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { ClassificationCategory } from "@/lib/database.types";

export interface ClassificationOption {
  id: string;
  value: string;
}

export async function listClassificationOptions(
  eventId: string,
  category: ClassificationCategory
): Promise<ClassificationOption[]> {
  const { data, error } = await supabaseAdmin()
    .from("classification_options")
    .select("id, value")
    .eq("event_id", eventId)
    .eq("category", category)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAllClassificationOptions(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("classification_options")
    .select("id, category, value")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;

  const affiliation = (data ?? [])
    .filter((o) => o.category === "affiliation")
    .map((o) => ({ id: o.id, value: o.value }));
  const area = (data ?? [])
    .filter((o) => o.category === "area")
    .map((o) => ({ id: o.id, value: o.value }));
  const genre = (data ?? [])
    .filter((o) => o.category === "genre")
    .map((o) => ({ id: o.id, value: o.value }));
  return { affiliation, area, genre };
}

export async function createClassificationOption(
  eventId: string,
  category: ClassificationCategory,
  value: string
) {
  const existing = await listClassificationOptions(eventId, category);
  const { error } = await supabaseAdmin().from("classification_options").insert({
    event_id: eventId,
    category,
    value,
    sort_order: existing.length,
  });
  if (error) throw error;
}

export async function renameClassificationOption(id: string, value: string) {
  const { error } = await supabaseAdmin()
    .from("classification_options")
    .update({ value })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteClassificationOption(id: string) {
  const { error } = await supabaseAdmin().from("classification_options").delete().eq("id", id);
  if (error) throw error;
}

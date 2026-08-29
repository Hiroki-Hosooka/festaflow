import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export async function getEventBySlug(slug: string) {
  const { data, error } = await supabaseAdmin()
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data;
}

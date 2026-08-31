import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export async function listAdminCalendarEvents(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("calendar_events")
    .select("*")
    .eq("event_id", eventId)
    .eq("owner_kind", "admin")
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listGroupCalendarEvents(eventId: string, groupId: string) {
  const { data, error } = await supabaseAdmin()
    .from("calendar_events")
    .select("*")
    .eq("event_id", eventId)
    .eq("owner_kind", "group")
    .eq("owner_group_id", groupId)
    .order("event_date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAdminCalendarEvent(params: {
  eventId: string;
  title: string;
  eventDate: string;
  color: string;
}) {
  const { error } = await supabaseAdmin().from("calendar_events").insert({
    event_id: params.eventId,
    owner_kind: "admin",
    owner_group_id: null,
    title: params.title,
    event_date: params.eventDate,
    color: params.color,
  });
  if (error) throw error;
}

export async function createGroupCalendarEvent(params: {
  eventId: string;
  groupId: string;
  title: string;
  eventDate: string;
  color: string;
}) {
  const { error } = await supabaseAdmin().from("calendar_events").insert({
    event_id: params.eventId,
    owner_kind: "group",
    owner_group_id: params.groupId,
    title: params.title,
    event_date: params.eventDate,
    color: params.color,
  });
  if (error) throw error;
}

export async function getCalendarEvent(id: string) {
  const { data, error } = await supabaseAdmin()
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteCalendarEvent(id: string) {
  const { error } = await supabaseAdmin().from("calendar_events").delete().eq("id", id);
  if (error) throw error;
}

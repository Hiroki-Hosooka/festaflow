import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export interface PushSubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function addAdminPushSubscription(eventId: string, sub: PushSubscriptionInput) {
  const { error } = await supabaseAdmin().from("push_subscriptions").upsert(
    {
      event_id: eventId,
      kind: "admin",
      group_id: null,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function addGroupPushSubscription(
  eventId: string,
  groupId: string,
  sub: PushSubscriptionInput
) {
  const { error } = await supabaseAdmin().from("push_subscriptions").upsert(
    {
      event_id: eventId,
      kind: "group",
      group_id: groupId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function removePushSubscription(endpoint: string) {
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}

export async function deletePushSubscriptionsByEndpoints(endpoints: string[]) {
  if (endpoints.length === 0) return;
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .in("endpoint", endpoints);
  if (error) throw error;
}

export async function listAdminPushSubscriptions(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("event_id", eventId)
    .eq("kind", "admin");
  if (error) throw error;
  return data ?? [];
}

export async function listGroupPushSubscriptions(eventId: string, groupId: string) {
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("event_id", eventId)
    .eq("kind", "group")
    .eq("group_id", groupId);
  if (error) throw error;
  return data ?? [];
}

export async function listPushSubscriptionsForGroups(eventId: string, groupIds: string[]) {
  if (groupIds.length === 0) return [];
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("event_id", eventId)
    .eq("kind", "group")
    .in("group_id", groupIds);
  if (error) throw error;
  return data ?? [];
}

export async function listAllGroupPushSubscriptions(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("event_id", eventId)
    .eq("kind", "group");
  if (error) throw error;
  return data ?? [];
}

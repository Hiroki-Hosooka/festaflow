import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export async function listGroups(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("groups")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getGroup(groupId: string) {
  const { data, error } = await supabaseAdmin()
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createGroup(params: {
  eventId: string;
  name: string;
  passphraseHash: string;
  budgetAllocated: number;
}) {
  const { data, error } = await supabaseAdmin()
    .from("groups")
    .insert({
      event_id: params.eventId,
      name: params.name,
      passphrase_hash: params.passphraseHash,
      budget_allocated: params.budgetAllocated,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateGroupBudget(groupId: string, budgetAllocated: number) {
  const { error } = await supabaseAdmin()
    .from("groups")
    .update({ budget_allocated: budgetAllocated })
    .eq("id", groupId);

  if (error) throw error;
}

export async function updateGroupPassphrase(groupId: string, passphraseHash: string) {
  const { error } = await supabaseAdmin()
    .from("groups")
    .update({ passphrase_hash: passphraseHash })
    .eq("id", groupId);

  if (error) throw error;
}

export async function deleteGroup(groupId: string) {
  const { error } = await supabaseAdmin().from("groups").delete().eq("id", groupId);
  if (error) throw error;
}

import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export function generateSlots(startTime: string, endTime: string, slotMinutes: number): string[] {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const slots: string[] = [];
  for (let t = startTotal; t + slotMinutes <= endTotal; t += slotMinutes) {
    const from = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    const toMinutes = t + slotMinutes;
    const to = `${String(Math.floor(toMinutes / 60)).padStart(2, "0")}:${String(
      toMinutes % 60
    ).padStart(2, "0")}`;
    slots.push(`${from}-${to}`);
  }
  return slots;
}

export async function getShiftConfig(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("shift_configs")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertShiftConfig(
  submissionId: string,
  params: { startTime: string; endTime: string; slotMinutes: number; peoplePerSlot: number }
) {
  const { error } = await supabaseAdmin()
    .from("shift_configs")
    .upsert(
      {
        submission_id: submissionId,
        start_time: params.startTime,
        end_time: params.endTime,
        slot_minutes: params.slotMinutes,
        people_per_slot: params.peoplePerSlot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "submission_id" }
    );
  if (error) throw error;
}

export async function listShiftMembers(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("shift_members")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addShiftMember(submissionId: string, name: string) {
  const { error } = await supabaseAdmin()
    .from("shift_members")
    .insert({ submission_id: submissionId, name });
  if (error) throw error;
}

export async function deleteShiftMember(memberId: string) {
  const { error } = await supabaseAdmin().from("shift_members").delete().eq("id", memberId);
  if (error) throw error;
}

export async function listShiftPreferences(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("shift_preferences")
    .select("*")
    .eq("submission_id", submissionId);
  if (error) throw error;
  return data ?? [];
}

export async function setPreference(
  submissionId: string,
  memberId: string,
  slotLabel: string,
  kind: "ng" | "want"
) {
  const { error } = await supabaseAdmin()
    .from("shift_preferences")
    .upsert(
      { submission_id: submissionId, member_id: memberId, slot_label: slotLabel, kind },
      { onConflict: "member_id,slot_label,kind" }
    );
  if (error) throw error;
}

export async function removePreference(memberId: string, slotLabel: string, kind: "ng" | "want") {
  const { error } = await supabaseAdmin()
    .from("shift_preferences")
    .delete()
    .eq("member_id", memberId)
    .eq("slot_label", slotLabel)
    .eq("kind", kind);
  if (error) throw error;
}

export async function replaceMemberPreferences(
  submissionId: string,
  memberId: string,
  preferences: { slotLabel: string; kind: "ng" | "want" }[]
) {
  const { error: delErr } = await supabaseAdmin()
    .from("shift_preferences")
    .delete()
    .eq("member_id", memberId);
  if (delErr) throw delErr;
  if (preferences.length === 0) return;

  const { error } = await supabaseAdmin()
    .from("shift_preferences")
    .insert(
      preferences.map((p) => ({
        submission_id: submissionId,
        member_id: memberId,
        slot_label: p.slotLabel,
        kind: p.kind,
      }))
    );
  if (error) throw error;
}

export async function listShiftAssignments(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("shift_assignments")
    .select("*")
    .eq("submission_id", submissionId);
  if (error) throw error;
  return data ?? [];
}

export async function setAssignment(submissionId: string, slotLabel: string, memberId: string) {
  const { error } = await supabaseAdmin()
    .from("shift_assignments")
    .upsert(
      { submission_id: submissionId, slot_label: slotLabel, member_id: memberId },
      { onConflict: "submission_id,slot_label,member_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeAssignment(submissionId: string, slotLabel: string, memberId: string) {
  const { error } = await supabaseAdmin()
    .from("shift_assignments")
    .delete()
    .eq("submission_id", submissionId)
    .eq("slot_label", slotLabel)
    .eq("member_id", memberId);
  if (error) throw error;
}

export async function replaceAssignments(
  submissionId: string,
  assignments: { slotLabel: string; memberId: string }[]
) {
  const { error: delErr } = await supabaseAdmin()
    .from("shift_assignments")
    .delete()
    .eq("submission_id", submissionId);
  if (delErr) throw delErr;
  if (assignments.length === 0) return;

  const { error } = await supabaseAdmin()
    .from("shift_assignments")
    .insert(
      assignments.map((a) => ({
        submission_id: submissionId,
        slot_label: a.slotLabel,
        member_id: a.memberId,
      }))
    );
  if (error) throw error;
}

export interface AutoAssignResult {
  assignments: { slotLabel: string; memberId: string }[];
  unfilledSlots: string[];
}

/**
 * NGを避け、希望(want)を優先しつつ、割当数をできるだけ均等にする貪欲法。
 * 本物のAIモデルは使わず、決定的なルールベースのアルゴリズムとして実装する。
 */
export function computeAutoAssignment(
  slots: string[],
  members: { id: string }[],
  preferences: { memberId: string; slotLabel: string; kind: "ng" | "want" }[],
  peoplePerSlot: number
): AutoAssignResult {
  const ngSet = new Set(
    preferences.filter((p) => p.kind === "ng").map((p) => `${p.memberId}:${p.slotLabel}`)
  );
  const wantSet = new Set(
    preferences.filter((p) => p.kind === "want").map((p) => `${p.memberId}:${p.slotLabel}`)
  );

  const assignedCount = new Map(members.map((m) => [m.id, 0]));
  const assignments: { slotLabel: string; memberId: string }[] = [];
  const unfilledSlots: string[] = [];

  for (const slot of slots) {
    const eligible = members.filter((m) => !ngSet.has(`${m.id}:${slot}`));
    const ranked = eligible.sort((a, b) => {
      const wantA = wantSet.has(`${a.id}:${slot}`) ? 1 : 0;
      const wantB = wantSet.has(`${b.id}:${slot}`) ? 1 : 0;
      if (wantA !== wantB) return wantB - wantA;
      return (assignedCount.get(a.id) ?? 0) - (assignedCount.get(b.id) ?? 0);
    });

    const picked = ranked.slice(0, peoplePerSlot);
    for (const m of picked) {
      assignments.push({ slotLabel: slot, memberId: m.id });
      assignedCount.set(m.id, (assignedCount.get(m.id) ?? 0) + 1);
    }
    if (picked.length < peoplePerSlot) {
      unfilledSlots.push(slot);
    }
  }

  return { assignments, unfilledSlots };
}

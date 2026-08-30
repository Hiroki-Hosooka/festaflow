"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import {
  upsertShiftConfig,
  addShiftMember,
  deleteShiftMember,
  listShiftMembers,
  getShiftConfig,
  listShiftPreferences,
  replaceMemberPreferences,
  computeAutoAssignment,
  replaceAssignments,
  setAssignment,
  removeAssignment,
  generateSlots,
} from "@/lib/data/shifts";

async function requireLeader(eventSlug: string) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") throw new Error("この操作はクラスリーダーのみ行えます。");
  return auth;
}

export interface ConfigFormState {
  error?: string;
  success?: string;
}

export async function saveShiftConfigAction(
  eventSlug: string,
  _prevState: ConfigFormState,
  formData: FormData
): Promise<ConfigFormState> {
  const auth = await requireLeader(eventSlug);

  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  const slotMinutes = Number(formData.get("slot_minutes"));
  const peoplePerSlot = Math.max(1, Math.floor(Number(formData.get("people_per_slot")) || 1));

  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timePattern.test(startTime) || !timePattern.test(endTime) || startTime >= endTime) {
    return {
      error: "開始時刻・終了時刻は「9:00」のように24時間表記の「時:分」で、開始<終了になるよう入力してください。",
    };
  }
  if (![30, 60, 90, 120].includes(slotMinutes)) {
    return { error: "1シフトの時間単位を選択してください。" };
  }

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await upsertShiftConfig(submission.id, { startTime, endTime, slotMinutes, peoplePerSlot });

  revalidatePath(`/${eventSlug}/group/shifts`);
  return { success: "シフト設定を保存しました。" };
}

export async function addShiftMemberAction(eventSlug: string, formData: FormData) {
  const auth = await requireLeader(eventSlug);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await addShiftMember(submission.id, name);
  revalidatePath(`/${eventSlug}/group/shifts`);
}

export async function deleteShiftMemberAction(eventSlug: string, memberId: string) {
  await requireLeader(eventSlug);
  await deleteShiftMember(memberId);
  revalidatePath(`/${eventSlug}/group/shifts`);
}

export interface PreferenceFormState {
  error?: string;
  success?: string;
}

export async function submitPreferencesAction(
  eventSlug: string,
  _prevState: PreferenceFormState,
  formData: FormData
): Promise<PreferenceFormState> {
  const auth = await requireGroupSession(eventSlug);

  const memberId = String(formData.get("member_id") ?? "");
  if (!memberId) {
    return { error: "自分の名前を選択してください。" };
  }

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const members = await listShiftMembers(submission.id);
  if (!members.some((m) => m.id === memberId)) {
    return { error: "名簿に登録されていません。リーダーに追加を依頼してください。" };
  }

  const preferences: { slotLabel: string; kind: "ng" | "want" }[] = [];
  for (const [key, value] of formData.entries()) {
    if (value !== "on") continue;
    if (key.startsWith("ng:")) preferences.push({ slotLabel: key.slice(3), kind: "ng" });
    if (key.startsWith("want:")) preferences.push({ slotLabel: key.slice(5), kind: "want" });
  }

  await replaceMemberPreferences(submission.id, memberId, preferences);
  revalidatePath(`/${eventSlug}/group/shifts`);
  return { success: "希望を送信しました。" };
}

export interface AutoAssignState {
  error?: string;
  success?: string;
  unfilledSlots?: string[];
}

export async function autoAssignAction(
  eventSlug: string,
  _prevState: AutoAssignState
): Promise<AutoAssignState> {
  const auth = await requireLeader(eventSlug);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);

  const config = await getShiftConfig(submission.id);
  if (!config) {
    return { error: "先にシフト設定（活動時間・コマ時間）を保存してください。" };
  }

  const [members, preferences] = await Promise.all([
    listShiftMembers(submission.id),
    listShiftPreferences(submission.id),
  ]);
  if (members.length === 0) {
    return { error: "名簿にメンバーを追加してください。" };
  }

  const slots = generateSlots(config.start_time, config.end_time, config.slot_minutes);
  const result = computeAutoAssignment(
    slots,
    members,
    preferences.map((p) => ({ memberId: p.member_id, slotLabel: p.slot_label, kind: p.kind })),
    config.people_per_slot
  );

  await replaceAssignments(submission.id, result.assignments);
  revalidatePath(`/${eventSlug}/group/shifts`);

  if (result.unfilledSlots.length > 0) {
    return {
      success: "自動配置しました。ただし人数が足りないコマがあります。",
      unfilledSlots: result.unfilledSlots,
    };
  }
  return { success: "自動配置しました。" };
}

export async function addAssignmentAction(eventSlug: string, formData: FormData) {
  const auth = await requireLeader(eventSlug);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const slotLabel = String(formData.get("slot_label") ?? "");
  const memberId = String(formData.get("member_id") ?? "");
  if (!slotLabel || !memberId) return;

  await setAssignment(submission.id, slotLabel, memberId);
  revalidatePath(`/${eventSlug}/group/shifts`);
}

export async function removeAssignmentAction(
  eventSlug: string,
  slotLabel: string,
  memberId: string
) {
  const auth = await requireLeader(eventSlug);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await removeAssignment(submission.id, slotLabel, memberId);
  revalidatePath(`/${eventSlug}/group/shifts`);
}

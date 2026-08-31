"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getGroup, updateGroupPassphrase, updateGroupMemberPassphrase } from "@/lib/data/groups";
import { hashPassword, verifyPassword } from "@/lib/auth";
import {
  addGroupPushSubscription,
  removePushSubscription,
  type PushSubscriptionInput,
} from "@/lib/data/pushSubscriptions";

export interface ChangePassphraseState {
  error?: string;
  success?: string;
}

export async function changePassphraseAction(
  eventSlug: string,
  _prevState: ChangePassphraseState,
  formData: FormData
): Promise<ChangePassphraseState> {
  const auth = await requireGroupSession(eventSlug);

  const currentPassphrase = String(formData.get("current_passphrase") ?? "");
  const newPassphrase = String(formData.get("new_passphrase") ?? "").trim();
  const confirmPassphrase = String(formData.get("confirm_passphrase") ?? "").trim();

  if (!currentPassphrase || !newPassphrase || !confirmPassphrase) {
    return { error: "すべての項目を入力してください。" };
  }
  if (newPassphrase !== confirmPassphrase) {
    return { error: "新しい合言葉が一致しません。" };
  }
  if (newPassphrase.length < 4) {
    return { error: "新しい合言葉は4文字以上にしてください。" };
  }

  const group = await getGroup(auth.groupId);
  if (!group) return { error: "団体情報が見つかりません。" };

  const ok = await verifyPassword(currentPassphrase, group.passphrase_hash);
  if (!ok) return { error: "現在の合言葉が正しくありません。" };

  await updateGroupPassphrase(auth.groupId, await hashPassword(newPassphrase));
  return { success: "合言葉を変更しました。次回のログインから新しい合言葉を使用してください。" };
}

export interface MemberPassphraseState {
  error?: string;
  success?: string;
}

export async function setMemberPassphraseAction(
  eventSlug: string,
  _prevState: MemberPassphraseState,
  formData: FormData
): Promise<MemberPassphraseState> {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") {
    return { error: "この操作はクラスリーダーのみ行えます。" };
  }

  const passphrase = String(formData.get("passphrase") ?? "").trim();

  if (!passphrase) {
    await updateGroupMemberPassphrase(auth.groupId, null);
    revalidatePath(`/${eventSlug}/admin/groups`);
    return { success: "一般生徒用合言葉を解除しました。" };
  }

  if (passphrase.length < 4) {
    return { error: "合言葉は4文字以上にしてください。" };
  }

  await updateGroupMemberPassphrase(auth.groupId, await hashPassword(passphrase));
  revalidatePath(`/${eventSlug}/admin/groups`);
  return { success: "一般生徒用合言葉を設定しました。" };
}

export async function subscribeGroupPushAction(eventSlug: string, sub: PushSubscriptionInput) {
  const auth = await requireGroupSession(eventSlug);
  await addGroupPushSubscription(auth.eventId, auth.groupId, sub);
}

export async function unsubscribeGroupPushAction(eventSlug: string, endpoint: string) {
  await requireGroupSession(eventSlug);
  await removePushSubscription(endpoint);
}

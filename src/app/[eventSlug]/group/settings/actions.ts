"use server";

import { requireGroupSession } from "@/lib/session";
import { getGroup, updateGroupPassphrase } from "@/lib/data/groups";
import { hashPassword, verifyPassword } from "@/lib/auth";

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

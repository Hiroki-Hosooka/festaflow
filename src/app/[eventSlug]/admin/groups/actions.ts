"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createGroup, updateGroupBudget } from "@/lib/data/groups";
import { hashPassword } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export interface GroupFormState {
  error?: string;
  success?: string;
}

export async function createGroupAction(
  eventSlug: string,
  _prevState: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const auth = await requireAdminSession(eventSlug);

  const name = String(formData.get("name") ?? "").trim();
  const passphrase = String(formData.get("passphrase") ?? "").trim();
  const budget = Math.max(0, Math.floor(Number(formData.get("budget")) || 0));

  if (!name || !passphrase) {
    return { error: "団体名と合言葉を入力してください。" };
  }

  try {
    await createGroup({
      eventId: auth.eventId,
      name,
      passphraseHash: await hashPassword(passphrase),
      budgetAllocated: budget,
    });
  } catch {
    return { error: "登録に失敗しました。同じ団体名がすでに存在しないか確認してください。" };
  }

  revalidatePath(`/${eventSlug}/admin/groups`);
  return { success: `${name} を追加しました。` };
}

export async function updateGroupBudgetAction(
  eventSlug: string,
  groupId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);
  const budget = Math.max(0, Math.floor(Number(formData.get("budget")) || 0));
  await updateGroupBudget(groupId, budget);
  revalidatePath(`/${eventSlug}/admin/groups`);
}

export async function resetPassphraseAction(
  eventSlug: string,
  groupId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);
  const passphrase = String(formData.get("passphrase") ?? "").trim();
  if (!passphrase) return;
  const hash = await hashPassword(passphrase);
  const { error } = await supabaseAdmin()
    .from("groups")
    .update({ passphrase_hash: hash })
    .eq("id", groupId);
  if (error) throw error;
  revalidatePath(`/${eventSlug}/admin/groups`);
}

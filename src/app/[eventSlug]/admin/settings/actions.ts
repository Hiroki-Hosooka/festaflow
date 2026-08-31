"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { updateEventSettings } from "@/lib/data/events";

export interface EventSettingsFormState {
  error?: string;
  success?: string;
}

export async function updateEventSettingsAction(
  eventSlug: string,
  _prevState: EventSettingsFormState,
  formData: FormData
): Promise<EventSettingsFormState> {
  const auth = await requireAdminSession(eventSlug);
  const name = String(formData.get("name") ?? "").trim();
  const adminLabel = String(formData.get("admin_label") ?? "").trim();

  if (!name) return { error: "イベント名を入力してください。" };
  if (!adminLabel) return { error: "管理者の名称を入力してください。" };

  await updateEventSettings(auth.eventId, { name, adminLabel });
  revalidatePath(`/${eventSlug}`, "layout");
  return { success: "設定を保存しました。" };
}

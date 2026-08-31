"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  createClassificationOption,
  renameClassificationOption,
  deleteClassificationOption,
} from "@/lib/data/classificationOptions";
import type { ClassificationCategory } from "@/lib/database.types";

function parseCategory(raw: FormDataEntryValue | null): ClassificationCategory | null {
  return raw === "affiliation" || raw === "area" || raw === "genre" ? raw : null;
}

function revalidateAll(eventSlug: string) {
  revalidatePath(`/${eventSlug}/admin/classifications`);
  revalidatePath(`/${eventSlug}/admin/submissions`);
  revalidatePath(`/${eventSlug}/group/submission`);
}

export interface OptionFormState {
  error?: string;
  success?: string;
}

export async function createOptionAction(
  eventSlug: string,
  _prevState: OptionFormState,
  formData: FormData
): Promise<OptionFormState> {
  const auth = await requireAdminSession(eventSlug);
  const category = parseCategory(formData.get("category"));
  const value = String(formData.get("value") ?? "").trim();
  if (!category) return { error: "分類の種類が不正です。" };
  if (!value) return { error: "選択肢の名前を入力してください。" };

  await createClassificationOption(auth.eventId, category, value);
  revalidateAll(eventSlug);
  return { success: `「${value}」を追加しました。` };
}

export async function renameOptionAction(eventSlug: string, optionId: string, formData: FormData) {
  await requireAdminSession(eventSlug);
  const value = String(formData.get("value") ?? "").trim();
  if (!value) return;

  await renameClassificationOption(optionId, value);
  revalidateAll(eventSlug);
}

export async function deleteOptionAction(eventSlug: string, optionId: string) {
  await requireAdminSession(eventSlug);
  await deleteClassificationOption(optionId);
  revalidateAll(eventSlug);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  createFormField,
  deleteFormField,
  listFormFields,
  updateFormField,
} from "@/lib/data/formFields";
import type { FormFieldType } from "@/lib/database.types";

export interface FieldFormState {
  error?: string;
  success?: string;
}

export async function createFieldAction(
  eventSlug: string,
  _prevState: FieldFormState,
  formData: FormData
): Promise<FieldFormState> {
  const auth = await requireAdminSession(eventSlug);
  const label = String(formData.get("label") ?? "").trim();
  const fieldTypeRaw = String(formData.get("field_type") ?? "text");
  const fieldType: FormFieldType =
    fieldTypeRaw === "textarea" || fieldTypeRaw === "number" ? fieldTypeRaw : "text";
  const required = formData.get("required") === "on";

  if (!label) return { error: "項目名を入力してください。" };

  const existing = await listFormFields(auth.eventId);
  const key = `field_${Date.now().toString(36)}`;

  await createFormField({
    eventId: auth.eventId,
    key,
    label,
    fieldType,
    required,
    sortOrder: existing.length,
  });

  revalidatePath(`/${eventSlug}/admin/fields`);
  revalidatePath(`/${eventSlug}/group/submission`);
  return {
    success: `「${label}」を追加しました。既存の提出物ではこの項目は未入力のままになります。`,
  };
}

export async function deleteFieldAction(eventSlug: string, fieldId: string) {
  await requireAdminSession(eventSlug);
  await deleteFormField(fieldId);
  revalidatePath(`/${eventSlug}/admin/fields`);
  revalidatePath(`/${eventSlug}/group/submission`);
}

export async function updateFieldAction(
  eventSlug: string,
  fieldId: string,
  _prevState: FieldFormState,
  formData: FormData
): Promise<FieldFormState> {
  await requireAdminSession(eventSlug);
  const label = String(formData.get("label") ?? "").trim();
  const required = formData.get("required") === "on";
  if (!label) return { error: "項目名を入力してください。" };

  await updateFormField(fieldId, { label, required });
  revalidatePath(`/${eventSlug}/admin/fields`);
  revalidatePath(`/${eventSlug}/group/submission`);
  return { success: `「${label}」に変更しました。` };
}

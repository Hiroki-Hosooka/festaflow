"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getGroup } from "@/lib/data/groups";
import { listFormFields } from "@/lib/data/formFields";
import {
  getOrCreateSubmission,
  updateSubmissionCore,
  replaceSubmissionItems,
  replaceFieldValues,
  markSubmitted,
  sumItems,
} from "@/lib/data/submissions";

interface ItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
}

function parseItems(json: string): ItemInput[] {
  try {
    const raw = JSON.parse(json);
    if (!Array.isArray(raw)) return [];
    return raw
      .map((i) => ({
        name: String(i?.name ?? "").trim(),
        quantity: Math.max(0, Math.floor(Number(i?.quantity) || 0)),
        unitPrice: Math.max(0, Math.floor(Number(i?.unitPrice) || 0)),
      }))
      .filter((i) => i.name.length > 0);
  } catch {
    return [];
  }
}

function parseFieldValues(json: string): Record<string, string> {
  try {
    const raw = JSON.parse(json);
    if (typeof raw !== "object" || raw === null) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      out[key] = String(value ?? "");
    }
    return out;
  } catch {
    return {};
  }
}

export interface SubmitFormState {
  error?: string;
  success?: string;
}

export async function saveSubmissionAction(
  eventSlug: string,
  _prevState: SubmitFormState,
  formData: FormData
): Promise<SubmitFormState> {
  const auth = await requireGroupSession(eventSlug);
  const intent = String(formData.get("intent") ?? "draft") === "submit" ? "submit" : "draft";

  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const items = parseItems(String(formData.get("items_json") ?? "[]"));
  const fieldValues = parseFieldValues(String(formData.get("field_values_json") ?? "{}"));

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);

  await updateSubmissionCore(submission.id, { name, content, location });
  await replaceSubmissionItems(submission.id, items);
  await replaceFieldValues(submission.id, fieldValues);

  revalidatePath(`/${eventSlug}/group`);

  if (intent === "draft") {
    return { success: "下書きを保存しました。" };
  }

  if (!name) {
    return { error: "企画名を入力してください。" };
  }

  const fields = await listFormFields(auth.eventId);
  const missingRequired = fields.filter(
    (f) => f.required && !(fieldValues[f.id] ?? "").trim()
  );
  if (missingRequired.length > 0) {
    return {
      error: `「${missingRequired.map((f) => f.label).join("」「")}」を入力してください。`,
    };
  }

  const group = await getGroup(auth.groupId);
  const plannedTotal = sumItems(
    items.map((i) => ({ quantity: i.quantity, unit_price: i.unitPrice }))
  );
  if (group && plannedTotal > group.budget_allocated) {
    return {
      error: `配分予算（¥${group.budget_allocated.toLocaleString()}）を ¥${(
        plannedTotal - group.budget_allocated
      ).toLocaleString()} 超えています。物品を見直してください。`,
    };
  }

  await markSubmitted(submission.id);
  revalidatePath(`/${eventSlug}/group`);
  return { success: "提出しました。" };
}

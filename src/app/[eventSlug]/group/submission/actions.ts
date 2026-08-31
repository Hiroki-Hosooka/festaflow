"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getGroup } from "@/lib/data/groups";
import { listFormFields, isFieldApplicable } from "@/lib/data/formFields";
import {
  getOrCreateSubmission,
  updateSubmissionCore,
  replaceSubmissionItems,
  replaceFieldValues,
  markSubmitted,
  sumItems,
} from "@/lib/data/submissions";
import {
  addAttachment,
  deleteAttachment,
  getAttachment,
  addAttachmentComment,
} from "@/lib/data/attachments";
import { listClassificationOptions } from "@/lib/data/classificationOptions";
import type { ItemKind } from "@/lib/database.types";

interface ItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  kind: ItemKind;
  inventoryItemId: string | null;
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
        kind: (i?.kind === "borrow" ? "borrow" : "purchase") as ItemKind,
        inventoryItemId: i?.inventoryItemId ? String(i.inventoryItemId) : null,
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
  if (auth.role !== "leader") {
    return { error: "この操作はクラスリーダーのみ行えます。" };
  }
  const intent = String(formData.get("intent") ?? "draft") === "submit" ? "submit" : "draft";

  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const affiliationRaw = String(formData.get("affiliation") ?? "");
  const areaRaw = String(formData.get("area") ?? "");
  const genreRaw = String(formData.get("genre") ?? "");
  const teacherCheck = formData.get("teacher_check") === "on";
  const [affiliationOptions, areaOptions, genreOptions] = await Promise.all([
    listClassificationOptions(auth.eventId, "affiliation"),
    listClassificationOptions(auth.eventId, "area"),
    listClassificationOptions(auth.eventId, "genre"),
  ]);
  const affiliation = affiliationOptions.some((o) => o.value === affiliationRaw)
    ? affiliationRaw
    : null;
  const area = areaOptions.some((o) => o.value === areaRaw) ? areaRaw : null;
  const genre = genreOptions.some((o) => o.value === genreRaw) ? genreRaw : null;
  const items = parseItems(String(formData.get("items_json") ?? "[]"));
  const fieldValues = parseFieldValues(String(formData.get("field_values_json") ?? "{}"));

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);

  await updateSubmissionCore(submission.id, {
    name,
    content,
    location,
    affiliation,
    area,
    genre,
    teacherCheck,
  });
  await replaceSubmissionItems(submission.id, items);
  await replaceFieldValues(submission.id, fieldValues);

  revalidatePath(`/${eventSlug}/group/submission`);

  if (intent === "draft") {
    return { success: "下書きを保存しました。" };
  }

  if (!name) {
    return { error: "企画名を入力してください。" };
  }

  const fields = await listFormFields(auth.eventId);
  const missingRequired = fields.filter(
    (f) => f.required && isFieldApplicable(f, genre) && !(fieldValues[f.id] ?? "").trim()
  );
  if (missingRequired.length > 0) {
    return {
      error: `「${missingRequired.map((f) => f.label).join("」「")}」を入力してください。`,
    };
  }

  if (!teacherCheck) {
    return { error: "「担任・部活動顧問の確認を受けました」にチェックしてください。" };
  }

  const unselectedBorrowItem = items.find(
    (i) => i.kind === "borrow" && !i.inventoryItemId
  );
  if (unselectedBorrowItem) {
    return { error: `「${unselectedBorrowItem.name}」の借用元の物品を選択してください。` };
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
  revalidatePath(`/${eventSlug}/group/submission`);
  return { success: "提出しました。" };
}

export interface AttachmentFormState {
  error?: string;
  success?: string;
}

export async function uploadAttachmentAction(
  eventSlug: string,
  _prevState: AttachmentFormState,
  formData: FormData
): Promise<AttachmentFormState> {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") {
    return { error: "この操作はクラスリーダーのみ行えます。" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ファイルを選択してください。" };
  }

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await addAttachment(submission.id, file);

  revalidatePath(`/${eventSlug}/group/submission`);
  return { success: `「${file.name}」をアップロードしました。` };
}

export async function deleteAttachmentAction(eventSlug: string, attachmentId: string) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") return;

  const attachment = await getAttachment(attachmentId);
  if (!attachment || attachment.review_status !== "pending") return;

  await deleteAttachment(attachmentId);
  revalidatePath(`/${eventSlug}/group/submission`);
}

export async function addGroupAttachmentCommentAction(
  eventSlug: string,
  attachmentId: string,
  formData: FormData
) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") return;

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const attachment = await getAttachment(attachmentId);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  if (!attachment || attachment.submission_id !== submission.id) return;

  await addAttachmentComment(attachmentId, "group", body);
  revalidatePath(`/${eventSlug}/group/submission`);
}

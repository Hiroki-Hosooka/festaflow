"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { addEventDocument, deleteEventDocument } from "@/lib/data/documents";

export interface DocumentFormState {
  error?: string;
  success?: string;
}

export async function uploadDocumentAction(
  eventSlug: string,
  _prevState: DocumentFormState,
  formData: FormData
): Promise<DocumentFormState> {
  const auth = await requireAdminSession(eventSlug);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "ファイルを選択してください。" };
  }

  await addEventDocument(auth.eventId, file);

  revalidatePath(`/${eventSlug}/admin/documents`);
  revalidatePath(`/${eventSlug}/group/documents`);
  return { success: `「${file.name}」をアップロードしました。` };
}

export async function deleteDocumentAction(eventSlug: string, documentId: string) {
  await requireAdminSession(eventSlug);
  await deleteEventDocument(documentId);
  revalidatePath(`/${eventSlug}/admin/documents`);
  revalidatePath(`/${eventSlug}/group/documents`);
}

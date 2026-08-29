"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { decideSubmission } from "@/lib/data/submissions";
import { addComment } from "@/lib/data/comments";

export interface DecideFormState {
  error?: string;
  success?: string;
}

export async function decideSubmissionAction(
  eventSlug: string,
  submissionId: string,
  _prevState: DecideFormState,
  formData: FormData
): Promise<DecideFormState> {
  await requireAdminSession(eventSlug);

  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected" && decision !== "returned") {
    return { error: "操作が不正です。" };
  }
  const comment = String(formData.get("comment") ?? "").trim();
  if ((decision === "rejected" || decision === "returned") && !comment) {
    return { error: "却下・差し戻しの場合はコメントを入力してください。" };
  }

  await decideSubmission(submissionId, decision, comment);
  if (comment) {
    await addComment(submissionId, "admin", comment);
  }

  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
  revalidatePath(`/${eventSlug}/admin`);

  const labels: Record<typeof decision, string> = {
    approved: "承認しました。",
    rejected: "却下しました。",
    returned: "差し戻しました。",
  };
  return { success: labels[decision] };
}

export async function sendAdminCommentAction(
  eventSlug: string,
  submissionId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addComment(submissionId, "admin", body);
  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
}

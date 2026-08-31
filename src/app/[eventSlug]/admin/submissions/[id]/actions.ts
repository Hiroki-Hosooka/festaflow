"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  decideSubmission,
  listBorrowStockStatuses,
  getSubmissionGroupInfo,
} from "@/lib/data/submissions";
import { addComment } from "@/lib/data/comments";
import { setStockDecision } from "@/lib/data/inventory";
import { reviewAttachment, addAttachmentComment } from "@/lib/data/attachments";
import { listGroupPushSubscriptions } from "@/lib/data/pushSubscriptions";
import { sendPushToSubscriptions } from "@/lib/push";
import { getEventBySlug } from "@/lib/data/events";
import type { ReviewStatus, StockStatus } from "@/lib/database.types";

async function notifyGroup(eventSlug: string, eventId: string, submissionId: string, body: string) {
  try {
    const [event, info] = await Promise.all([
      getEventBySlug(eventSlug),
      getSubmissionGroupInfo(submissionId),
    ]);
    if (!info) return;
    const subscriptions = await listGroupPushSubscriptions(eventId, info.groupId);
    await sendPushToSubscriptions(subscriptions, {
      title: `${event?.admin_label ?? "実行委員会"}から新着コメント`,
      body,
      url: `/${eventSlug}/group/messages`,
    });
  } catch {
    // 通知の送信失敗は本来の操作を失敗させない
  }
}

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
  const auth = await requireAdminSession(eventSlug);

  const decision = String(formData.get("decision") ?? "");
  if (decision !== "approved" && decision !== "rejected" && decision !== "returned") {
    return { error: "操作が不正です。" };
  }
  const comment = String(formData.get("comment") ?? "").trim();
  if ((decision === "rejected" || decision === "returned") && !comment) {
    return { error: "却下・差し戻しの場合はコメントを入力してください。" };
  }

  if (decision === "approved") {
    const borrowItems = await listBorrowStockStatuses(submissionId);
    const pending = borrowItems.filter((i) => i.stock_status === "pending");
    if (pending.length > 0) {
      return {
        error: `借用物品「${pending.map((i) => i.name).join("・")}」の在庫確保の判断が済んでいません。先に「確保する」または「確保できず」を選択してから承認してください。`,
      };
    }
  }

  await decideSubmission(submissionId, decision, comment);
  if (comment) {
    await addComment(submissionId, "admin", comment);
    await notifyGroup(eventSlug, auth.eventId, submissionId, comment);
  }

  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
  revalidatePath(`/${eventSlug}/admin/submissions`);

  const labels: Record<typeof decision, string> = {
    approved: "承認しました。",
    rejected: "却下しました。",
    returned: "差し戻しました。",
  };
  return { success: labels[decision] };
}

export async function setStockDecisionAction(
  eventSlug: string,
  submissionId: string,
  submissionItemId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);

  const stockStatus = String(formData.get("stock_status") ?? "") as StockStatus;
  if (stockStatus !== "pending" && stockStatus !== "secured" && stockStatus !== "denied") return;

  const securedQuantity =
    stockStatus === "secured"
      ? Math.max(0, Math.floor(Number(formData.get("secured_quantity")) || 0))
      : 0;

  await setStockDecision(submissionItemId, { stockStatus, securedQuantity });

  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
  revalidatePath(`/${eventSlug}/admin/inventory`);
}

export async function reviewAttachmentAction(
  eventSlug: string,
  submissionId: string,
  attachmentId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);

  const reviewStatus = String(formData.get("review_status") ?? "") as ReviewStatus;
  if (reviewStatus !== "approved" && reviewStatus !== "needs_fix") return;

  await reviewAttachment(attachmentId, { reviewStatus });
  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
}

export async function addAttachmentCommentAction(
  eventSlug: string,
  submissionId: string,
  attachmentId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await addAttachmentComment(attachmentId, "admin", body);
  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
}

export async function sendAdminCommentAction(
  eventSlug: string,
  submissionId: string,
  formData: FormData
) {
  const auth = await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await addComment(submissionId, "admin", body);
  revalidatePath(`/${eventSlug}/admin/submissions/${submissionId}`);
  await notifyGroup(eventSlug, auth.eventId, submissionId, body);
}

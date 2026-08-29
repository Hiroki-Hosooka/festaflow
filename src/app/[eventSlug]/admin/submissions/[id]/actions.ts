"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { decideSubmission, listBorrowStockStatuses } from "@/lib/data/submissions";
import { addComment } from "@/lib/data/comments";
import { setStockDecision } from "@/lib/data/inventory";
import type { StockStatus } from "@/lib/database.types";

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

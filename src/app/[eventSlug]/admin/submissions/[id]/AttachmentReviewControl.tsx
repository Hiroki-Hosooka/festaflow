"use client";

import { reviewAttachmentAction, addAttachmentCommentAction } from "./actions";
import { formatTime } from "@/lib/format";
import type { Database, ReviewStatus } from "@/lib/database.types";

type AttachmentCommentRow =
  Database["public"]["Tables"]["submission_attachment_comments"]["Row"];

const REVIEW_LABELS: Record<ReviewStatus, string> = {
  pending: "審査待ち",
  approved: "承認",
  needs_fix: "要修正",
};

const REVIEW_STYLES: Record<ReviewStatus, string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  approved: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  needs_fix: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)]",
};

export function AttachmentReviewControl({
  eventSlug,
  submissionId,
  attachmentId,
  reviewStatus,
  comments,
  groupName,
}: {
  eventSlug: string;
  submissionId: string;
  attachmentId: string;
  reviewStatus: ReviewStatus;
  comments: AttachmentCommentRow[];
  groupName: string;
}) {
  const boundReview = reviewAttachmentAction.bind(null, eventSlug, submissionId, attachmentId);
  const boundComment = addAttachmentCommentAction.bind(
    null,
    eventSlug,
    submissionId,
    attachmentId
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`status-badge ${REVIEW_STYLES[reviewStatus]}`}>
          {REVIEW_LABELS[reviewStatus]}
        </span>
        <form action={boundReview} className="flex items-center gap-1.5">
          <button
            type="submit"
            name="review_status"
            value="approved"
            className="h-8 px-2.5 rounded-md text-[11.5px] font-semibold btn-approve"
          >
            承認
          </button>
          <button
            type="submit"
            name="review_status"
            value="needs_fix"
            className="h-8 px-2.5 rounded-md text-[11.5px] font-semibold border border-[var(--danger-border)] text-[var(--danger-text)]"
          >
            要修正
          </button>
        </form>
      </div>

      {comments.length > 0 && (
        <div className="space-y-1.5">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`text-[12px] leading-relaxed ${c.sender_type === "admin" ? "text-right" : ""}`}
            >
              <span
                className={`inline-block rounded-lg px-2.5 py-1.5 max-w-[85%] ${
                  c.sender_type === "group"
                    ? "bg-[var(--background)]"
                    : "bg-[var(--accent-admin-soft-bg)]"
                }`}
              >
                {c.body}
              </span>
              <span className="block text-[10px] text-[var(--muted-2)] mt-0.5">
                {c.sender_type === "group" ? groupName : "自分"} · {formatTime(c.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      <form action={boundComment} noValidate className="flex items-center gap-1.5">
        <input
          name="body"
          required
          placeholder="指導コメントを送る..."
          className="h-8 flex-1 min-w-[140px] border border-[var(--border-strong)] rounded-md px-2 text-[12px]"
        />
        <button className="h-8 px-3 rounded-md text-[11.5px] font-semibold btn-admin">
          送信
        </button>
      </form>
    </div>
  );
}

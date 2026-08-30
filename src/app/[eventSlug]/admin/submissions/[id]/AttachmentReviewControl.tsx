"use client";

import { useState } from "react";
import { reviewAttachmentAction } from "./actions";
import type { ReviewStatus } from "@/lib/database.types";

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
  reviewComment,
}: {
  eventSlug: string;
  submissionId: string;
  attachmentId: string;
  reviewStatus: ReviewStatus;
  reviewComment: string;
}) {
  const boundAction = reviewAttachmentAction.bind(
    null,
    eventSlug,
    submissionId,
    attachmentId
  );
  const [comment, setComment] = useState(reviewComment);

  return (
    <div className="space-y-2">
      <span className={`status-badge ${REVIEW_STYLES[reviewStatus]}`}>
        {REVIEW_LABELS[reviewStatus]}
      </span>
      <form action={boundAction} className="flex items-center gap-1.5 flex-wrap">
        <input
          name="review_comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="指導コメント（任意）"
          className="h-8 flex-1 min-w-[140px] border border-[var(--border-strong)] rounded-md px-2 text-[12px]"
        />
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
  );
}

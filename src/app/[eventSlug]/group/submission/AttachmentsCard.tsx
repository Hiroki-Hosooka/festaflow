"use client";

import { useActionState } from "react";
import {
  uploadAttachmentAction,
  deleteAttachmentAction,
  addGroupAttachmentCommentAction,
  type AttachmentFormState,
} from "./actions";
import { formatDateTime, formatTime } from "@/lib/format";
import type { Database } from "@/lib/database.types";
import { EmptyState } from "@/components/EmptyState";

type AttachmentRow = Database["public"]["Tables"]["submission_attachments"]["Row"];
type AttachmentCommentRow =
  Database["public"]["Tables"]["submission_attachment_comments"]["Row"];

const REVIEW_LABELS: Record<AttachmentRow["review_status"], string> = {
  pending: "審査待ち",
  approved: "承認",
  needs_fix: "要修正",
};

const REVIEW_STYLES: Record<AttachmentRow["review_status"], string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  approved: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  needs_fix: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)]",
};

const initialState: AttachmentFormState = {};

export function AttachmentsCard({
  eventSlug,
  attachments,
  commentsByAttachment,
  canEdit,
  adminLabel,
}: {
  eventSlug: string;
  attachments: AttachmentRow[];
  commentsByAttachment: Record<string, AttachmentCommentRow[]>;
  canEdit: boolean;
  adminLabel: string;
}) {
  const boundUpload = uploadAttachmentAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundUpload, initialState);

  return (
    <div className="card p-6 sm:p-7 space-y-4">
      <div>
        <h2 className="card-heading">添付資料</h2>
        <p className="text-[11.5px] text-[var(--muted)] mt-0.5">
          設計図など、{adminLabel}に確認してほしい資料をアップロードできます。ファイルごとに承認・要修正の判定が届きます。
        </p>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 && (
          <EmptyState icon="document" title="まだ資料はアップロードされていません" />
        )}
        {attachments.map((a) => (
          <div
            key={a.id}
            className="border border-[var(--border)] rounded-lg px-3 py-2.5 space-y-1"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[12.5px] font-semibold">{a.file_name}</span>
              <div className="flex items-center gap-2">
                <span className={`status-badge ${REVIEW_STYLES[a.review_status]}`}>
                  {REVIEW_LABELS[a.review_status]}
                </span>
                {canEdit && a.review_status === "pending" && (
                  <DeleteAttachmentButton eventSlug={eventSlug} attachmentId={a.id} />
                )}
              </div>
            </div>
            <p className="text-[10.5px] text-[var(--muted-2)]">
              {formatDateTime(a.uploaded_at)}
            </p>
            <AttachmentThread
              eventSlug={eventSlug}
              attachmentId={a.id}
              comments={commentsByAttachment[a.id] ?? []}
              adminLabel={adminLabel}
              canReply={canEdit}
            />
          </div>
        ))}
      </div>

      {canEdit && (
        <form action={formAction} noValidate className="flex items-center gap-2 flex-wrap">
          <span className="file-input-wrapper">
            <input type="file" name="file" required aria-label="添付ファイルを選択" />
          </span>
          <button
            disabled={pending}
            className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-group disabled:opacity-60"
          >
            {pending ? "アップロード中..." : "アップロード"}
          </button>
          {state.error && (
            <p className="w-full text-[12.5px] text-[var(--danger-text)]">{state.error}</p>
          )}
          {state.success && (
            <p className="w-full text-[12.5px] text-[var(--status-approved-text)]">
              {state.success}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function AttachmentThread({
  eventSlug,
  attachmentId,
  comments,
  adminLabel,
  canReply,
}: {
  eventSlug: string;
  attachmentId: string;
  comments: AttachmentCommentRow[];
  adminLabel: string;
  canReply: boolean;
}) {
  const boundReply = addGroupAttachmentCommentAction.bind(null, eventSlug, attachmentId);

  if (comments.length === 0 && !canReply) return null;

  return (
    <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
      {comments.map((c) => (
        <div
          key={c.id}
          className={`text-[12px] leading-relaxed ${c.sender_type === "group" ? "text-right" : ""}`}
        >
          <span
            className={`inline-block rounded-lg px-2.5 py-1.5 max-w-[85%] ${
              c.sender_type === "admin"
                ? "bg-[var(--background)]"
                : "bg-[var(--accent-group-soft-bg)]"
            }`}
          >
            {c.body}
          </span>
          <span className="block text-[10px] text-[var(--muted-2)] mt-0.5">
            {c.sender_type === "admin" ? adminLabel : "自分"} · {formatTime(c.created_at)}
          </span>
        </div>
      ))}
      {canReply && (
        <form action={boundReply} noValidate className="flex items-center gap-1.5 pt-1">
          <input
            name="body"
            required
            placeholder="コメントを送る..."
            className="h-8 flex-1 border border-[var(--border)] rounded-md px-2 text-[12px]"
          />
          <button className="h-8 px-3 rounded-md text-[11.5px] font-semibold btn-group">
            送信
          </button>
        </form>
      )}
    </div>
  );
}

function DeleteAttachmentButton({
  eventSlug,
  attachmentId,
}: {
  eventSlug: string;
  attachmentId: string;
}) {
  const boundDelete = deleteAttachmentAction.bind(null, eventSlug, attachmentId);
  return (
    <form
      action={boundDelete}
      onSubmit={(e) => {
        if (!confirm("この資料を削除しますか？")) e.preventDefault();
      }}
    >
      <button className="btn-row btn-row-danger">削除</button>
    </form>
  );
}

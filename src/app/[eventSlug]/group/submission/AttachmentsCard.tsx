"use client";

import { useActionState } from "react";
import {
  uploadAttachmentAction,
  deleteAttachmentAction,
  type AttachmentFormState,
} from "./actions";
import { formatDateTime } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type AttachmentRow = Database["public"]["Tables"]["submission_attachments"]["Row"];

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
  canEdit,
  adminLabel,
}: {
  eventSlug: string;
  attachments: AttachmentRow[];
  canEdit: boolean;
  adminLabel: string;
}) {
  const boundUpload = uploadAttachmentAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundUpload, initialState);

  return (
    <div className="card p-6 sm:p-7 space-y-4">
      <div>
        <h2 className="text-sm font-bold">添付資料</h2>
        <p className="text-[11.5px] text-[var(--muted)] mt-0.5">
          設計図など、{adminLabel}に確認してほしい資料をアップロードできます。ファイルごとに承認・要修正の判定が届きます。
        </p>
      </div>

      <div className="space-y-2">
        {attachments.length === 0 && (
          <p className="text-[12.5px] text-[var(--muted-2)]">まだ資料はアップロードされていません。</p>
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
            {a.review_comment && (
              <p className="text-[12px] text-[var(--foreground)] leading-relaxed">
                {a.review_comment}
              </p>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form action={formAction} className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            name="file"
            required
            aria-label="添付ファイルを選択"
            className="text-[12.5px]"
          />
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
      <button className="text-[11px] text-[var(--danger-text)] font-semibold">削除</button>
    </form>
  );
}

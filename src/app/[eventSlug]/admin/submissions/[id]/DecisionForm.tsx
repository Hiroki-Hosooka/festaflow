"use client";

import { useActionState, useState } from "react";
import { decideSubmissionAction, type DecideFormState } from "./actions";

const initialState: DecideFormState = {};

export function DecisionForm({
  eventSlug,
  submissionId,
  defaultComment,
  pendingBorrowNames = [],
}: {
  eventSlug: string;
  submissionId: string;
  defaultComment: string;
  pendingBorrowNames?: string[];
}) {
  const boundAction = decideSubmissionAction.bind(null, eventSlug, submissionId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [comment, setComment] = useState(defaultComment);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] mb-1.5">
          コメント（団体に伝わります）
        </label>
        <textarea
          name="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="コメントを入力..."
          className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2.5 text-[12.5px]"
        />
      </div>
      {pendingBorrowNames.length > 0 && (
        <p className="text-[12.5px] text-[var(--warn-text)] leading-relaxed">
          借用物品「{pendingBorrowNames.join("・")}」の在庫確保が未確認のため、このままでは承認できません。上の借用物品欄で先に「確保する」または「確保できず」を選択してください。
        </p>
      )}
      {state.error && (
        <p className="text-[13px] text-[var(--danger-text)] font-medium">{state.error}</p>
      )}
      {state.success && !state.error && (
        <p className="text-[13px] text-[var(--status-approved-text)] font-medium">
          {state.success}
        </p>
      )}
      <div className="flex gap-2.5">
        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="flex-1 h-10 rounded-lg border border-[var(--danger-border)] text-[var(--danger-text)] text-[13px] font-bold disabled:opacity-60"
        >
          却下
        </button>
        <button
          type="submit"
          name="decision"
          value="returned"
          disabled={pending}
          className="flex-1 h-10 rounded-lg border border-[var(--warn-border)] text-[var(--warn-text)] text-[13px] font-bold disabled:opacity-60"
        >
          差し戻し
        </button>
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="flex-1 h-10 rounded-lg btn-approve text-[13px] font-bold disabled:opacity-60"
        >
          承認
        </button>
      </div>
    </form>
  );
}

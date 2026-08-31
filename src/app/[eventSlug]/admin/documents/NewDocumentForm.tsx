"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type DocumentFormState } from "./actions";

const initialState: DocumentFormState = {};

export function NewDocumentForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = uploadDocumentAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} noValidate key={state.success} className="flex items-center gap-2 flex-wrap">
      <span className="file-input-wrapper">
        <input type="file" name="file" required aria-label="配布資料を選択" />
      </span>
      <button
        disabled={pending}
        className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-admin disabled:opacity-60"
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
  );
}

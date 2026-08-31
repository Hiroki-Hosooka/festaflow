"use client";

import { useActionState } from "react";
import { createGroupAction, type GroupFormState } from "./actions";

const initialState: GroupFormState = {};

export function NewGroupForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = createGroupAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      noValidate
      key={state.success}
      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2.5 items-start"
    >
      <input
        name="name"
        required
        placeholder="団体名（例: 3年A組）"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <input
        name="passphrase"
        required
        placeholder="合言葉"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <input
        name="budget"
        type="number"
        min={0}
        defaultValue={0}
        placeholder="予算（円）"
        aria-label="配分予算（円）"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <button
        disabled={pending}
        className="btn-admin h-10 px-5 rounded-lg text-[13px] font-bold whitespace-nowrap disabled:opacity-60"
      >
        追加
      </button>
      {state.error && (
        <p className="col-span-full text-[13px] text-[var(--danger-text)]">{state.error}</p>
      )}
      {state.success && (
        <p className="col-span-full text-[13px] text-[var(--status-approved-text)]">
          {state.success}
        </p>
      )}
    </form>
  );
}

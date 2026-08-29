"use client";

import { useActionState } from "react";
import { createFieldAction, type FieldFormState } from "./actions";

const initialState: FieldFormState = {};

export function NewFieldForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = createFieldAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success}
      className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto_auto] gap-2.5 items-center"
    >
      <input
        name="label"
        required
        placeholder="項目名（例: 実施日）"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <select
        name="field_type"
        defaultValue="text"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px] bg-white"
      >
        <option value="text">一行テキスト</option>
        <option value="textarea">複数行テキスト</option>
        <option value="number">数値</option>
      </select>
      <label className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)] whitespace-nowrap">
        <input type="checkbox" name="required" /> 必須
      </label>
      <button
        disabled={pending}
        className="btn-admin h-10 px-5 rounded-lg text-[13px] font-bold whitespace-nowrap disabled:opacity-60"
      >
        項目を追加
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

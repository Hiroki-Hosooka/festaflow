"use client";

import { useActionState } from "react";
import { createFieldAction, type FieldFormState } from "./actions";

const initialState: FieldFormState = {};

export function NewFieldForm({
  eventSlug,
  genreOptions,
}: {
  eventSlug: string;
  genreOptions: string[];
}) {
  const boundAction = createFieldAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} noValidate key={state.success} className="flex flex-col gap-2.5">
      <input
        name="label"
        required
        placeholder="項目名（例: 実施日）"
        className="h-10 w-full border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <div className="flex flex-wrap items-center gap-2.5">
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
      </div>
      {genreOptions.length > 0 && (
        <div>
          <p className="text-[11px] text-[var(--muted)] mb-1">
            対象ジャンル（未選択の場合は全ジャンル共通の項目になります）
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {genreOptions.map((g) => (
              <label
                key={g}
                className="flex items-center gap-1.5 text-[12px] text-[var(--muted)] whitespace-nowrap"
              >
                <input type="checkbox" name="applicable_genres" value={g} /> {g}
              </label>
            ))}
          </div>
        </div>
      )}
      {state.error && <p className="text-[13px] text-[var(--danger-text)]">{state.error}</p>}
      {state.success && (
        <p className="text-[13px] text-[var(--status-approved-text)]">{state.success}</p>
      )}
    </form>
  );
}

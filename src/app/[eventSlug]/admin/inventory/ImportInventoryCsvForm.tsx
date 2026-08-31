"use client";

import { useActionState } from "react";
import { importInventoryCsvAction, type ImportCsvFormState } from "./actions";

const initialState: ImportCsvFormState = {};

export function ImportInventoryCsvForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = importInventoryCsvAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2.5">
      <span className="file-input-wrapper">
        <input type="file" name="file" accept=".csv,text/csv" required aria-label="在庫CSVファイルを選択" />
      </span>
      <button
        disabled={pending}
        className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-admin disabled:opacity-60"
      >
        {pending ? "取り込み中..." : "CSVから取り込み"}
      </button>
      {state.error && (
        <p className="w-full text-[12.5px] text-[var(--danger-text)]">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-[12.5px] text-[var(--status-approved-text)]">{state.success}</p>
      )}
    </form>
  );
}

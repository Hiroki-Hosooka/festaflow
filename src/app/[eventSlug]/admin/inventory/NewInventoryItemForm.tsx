"use client";

import { useActionState } from "react";
import { createInventoryItemAction, type InventoryFormState } from "./actions";

const initialState: InventoryFormState = {};

export function NewInventoryItemForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = createInventoryItemAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form
      action={formAction}
      key={state.success}
      className="grid grid-cols-1 sm:grid-cols-[1fr_100px_1fr_auto] gap-2.5 items-center"
    >
      <input
        name="name"
        required
        placeholder="物品名（例: 折りたたみ椅子）"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <input
        name="total_quantity"
        type="number"
        min={0}
        defaultValue={0}
        aria-label="在庫総数"
        placeholder="総数"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <input
        name="notes"
        placeholder="備考（任意）"
        className="h-10 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <button
        disabled={pending}
        className="btn-admin h-10 px-5 rounded-lg text-[13px] font-bold whitespace-nowrap disabled:opacity-60"
      >
        物品を追加
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

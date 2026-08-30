"use client";

import { useActionState } from "react";
import { updateFieldAction, type FieldFormState } from "./actions";
import type { Database } from "@/lib/database.types";

type FormFieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

const initialState: FieldFormState = {};

export function EditFieldForm({
  eventSlug,
  field,
}: {
  eventSlug: string;
  field: FormFieldRow;
}) {
  const boundAction = updateFieldAction.bind(null, eventSlug, field.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2.5">
      <input
        name="label"
        defaultValue={field.label}
        required
        className="h-9 border border-[var(--border-strong)] rounded-lg px-3 text-[13px]"
      />
      <label className="flex items-center gap-1.5 text-[12.5px] text-[var(--muted)] whitespace-nowrap">
        <input type="checkbox" name="required" defaultChecked={field.required} /> 必須
      </label>
      <button
        disabled={pending}
        className="h-9 px-4 rounded-lg text-[12.5px] font-semibold btn-admin whitespace-nowrap disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存"}
      </button>
      {state.error && (
        <p className="w-full text-[12px] text-[var(--danger-text)]">{state.error}</p>
      )}
      {state.success && (
        <p className="w-full text-[12px] text-[var(--status-approved-text)]">{state.success}</p>
      )}
    </form>
  );
}

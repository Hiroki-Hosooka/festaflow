"use client";

import { useActionState } from "react";
import { updateThemeAction, type ThemeFormState } from "./actions";
import { THEME_OPTIONS } from "@/lib/themes";
import type { ThemeKey } from "@/lib/database.types";

const initialState: ThemeFormState = {};

export function ThemeForm({ eventSlug, theme }: { eventSlug: string; theme: ThemeKey }) {
  const boundAction = updateThemeAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {THEME_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] text-[12.5px] cursor-pointer has-[:checked]:border-[var(--accent-admin-text)] has-[:checked]:bg-[var(--accent-admin-soft-bg)] has-[:checked]:font-semibold"
          >
            <input type="radio" name="theme" value={opt.value} defaultChecked={opt.value === theme} />
            {opt.label}
          </label>
        ))}
      </div>
      <button
        disabled={pending}
        className="h-9 px-4 rounded-lg text-[12.5px] font-semibold btn-admin disabled:opacity-60"
      >
        {pending ? "保存中..." : "保存"}
      </button>
      {state.error && <p className="text-[12px] text-[var(--danger-text)]">{state.error}</p>}
      {state.success && (
        <p className="text-[12px] text-[var(--status-approved-text)]">{state.success}</p>
      )}
    </form>
  );
}

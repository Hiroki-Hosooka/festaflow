"use client";

import { useActionState } from "react";
import { changePassphraseAction, type ChangePassphraseState } from "./actions";

const initialState: ChangePassphraseState = {};

export function ChangePassphraseForm({ eventSlug }: { eventSlug: string }) {
  const boundAction = changePassphraseAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} noValidate key={state.success} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold mb-1.5">現在の合言葉</label>
        <input
          type="password"
          name="current_passphrase"
          required
          autoComplete="current-password"
          className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5">新しい合言葉</label>
        <input
          type="password"
          name="new_passphrase"
          required
          autoComplete="new-password"
          className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5">新しい合言葉（確認）</label>
        <input
          type="password"
          name="confirm_passphrase"
          required
          autoComplete="new-password"
          className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm"
        />
      </div>
      {state.error && (
        <p className="text-[13px] text-[var(--danger-text)] font-medium">{state.error}</p>
      )}
      {state.success && !state.error && (
        <p className="text-[13px] text-[var(--status-approved-text)] font-medium">
          {state.success}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="btn-group h-11 px-6 rounded-lg text-sm font-bold disabled:opacity-60"
      >
        合言葉を変更する
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { setMemberPassphraseAction, type MemberPassphraseState } from "./actions";

const initialState: MemberPassphraseState = {};

export function MemberPassphraseForm({
  eventSlug,
  hasMemberPassphrase,
}: {
  eventSlug: string;
  hasMemberPassphrase: boolean;
}) {
  const boundAction = setMemberPassphraseAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} key={state.success} className="space-y-4">
      <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
        ここで設定した合言葉でログインした人は「一般生徒」として扱われ、閲覧とシフト希望の提出のみ行えます（企画の編集・提出はできません）。現在
        <span
          className={`font-bold ${
            hasMemberPassphrase ? "text-[var(--status-approved-text)]" : "text-[var(--warn-text)]"
          }`}
        >
          {hasMemberPassphrase ? "設定されています" : "未設定です"}
        </span>
        。
      </p>
      <div>
        <label className="block text-xs font-semibold mb-1.5">一般生徒用の合言葉</label>
        <input
          type="text"
          name="passphrase"
          autoComplete="off"
          placeholder="空欄のまま保存すると解除されます"
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
        保存する
      </button>
    </form>
  );
}

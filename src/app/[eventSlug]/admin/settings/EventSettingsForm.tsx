"use client";

import { useActionState } from "react";
import { updateEventSettingsAction, type EventSettingsFormState } from "./actions";

const initialState: EventSettingsFormState = {};

export function EventSettingsForm({
  eventSlug,
  name,
  adminLabel,
}: {
  eventSlug: string;
  name: string;
  adminLabel: string;
}) {
  const boundAction = updateEventSettingsAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold mb-1.5">イベント名</label>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3.5 text-[13px]"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5">管理者の名称</label>
        <p className="text-[11.5px] text-[var(--muted)] mb-1.5 leading-relaxed">
          団体側の画面にも表示されます（例:「実行委員会」「生徒会」など）。
        </p>
        <input
          name="admin_label"
          defaultValue={adminLabel}
          required
          className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3.5 text-[13px]"
        />
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

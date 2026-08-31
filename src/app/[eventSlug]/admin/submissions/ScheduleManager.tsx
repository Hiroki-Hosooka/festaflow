"use client";

import { useActionState } from "react";
import { createScheduleAction, deleteScheduleAction, type ScheduleFormState } from "./actions";
import { formatDateTime, daysUntil } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type ScheduleRow = Database["public"]["Tables"]["submission_schedules"]["Row"];

const initialState: ScheduleFormState = {};

export function ScheduleManager({
  eventSlug,
  schedules,
}: {
  eventSlug: string;
  schedules: ScheduleRow[];
}) {
  const boundCreate = createScheduleAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundCreate, initialState);

  return (
    <div className="card p-4 space-y-3">
      <div className="card-heading">提出締切</div>

      {schedules.length === 0 ? (
        <p className="text-[12.5px] text-[var(--muted-2)]">まだ登録されていません。</p>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <ScheduleRowItem key={s.id} eventSlug={eventSlug} schedule={s} />
          ))}
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
          提出物を追加登録
        </summary>
        <form action={formAction} noValidate className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 mt-2">
          <input
            name="title"
            required
            placeholder="提出物の名前（例: 企画書）"
            className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
          />
          <input
            type="datetime-local"
            name="deadline"
            required
            aria-label="締切日時（日本時間）"
            className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
          />
          <input
            name="hint"
            placeholder="提出方法のヒント（任意）"
            className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
          />
          <button
            disabled={pending}
            className="h-9 px-4 rounded-md text-[12.5px] font-semibold btn-admin whitespace-nowrap disabled:opacity-60"
          >
            追加登録
          </button>
          {state.error && (
            <p className="col-span-full text-[12.5px] text-[var(--danger-text)]">{state.error}</p>
          )}
          {state.success && (
            <p className="col-span-full text-[12.5px] text-[var(--status-approved-text)]">
              {state.success}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}

function ScheduleRowItem({
  eventSlug,
  schedule,
}: {
  eventSlug: string;
  schedule: ScheduleRow;
}) {
  const boundDelete = deleteScheduleAction.bind(null, eventSlug, schedule.id);
  const daysLeft = daysUntil(schedule.deadline);

  return (
    <div className="flex items-center justify-between gap-3 text-[12.5px] border border-[var(--border)] rounded-lg px-3 py-2">
      <div>
        <span className="font-semibold">{schedule.title}</span>
        <span className="ml-2 text-[var(--muted)]">{formatDateTime(schedule.deadline)}</span>
        {daysLeft < 0 ? (
          <span className="ml-2 text-[var(--danger-text)] font-semibold">締切超過</span>
        ) : daysLeft === 0 ? (
          <span className="ml-2 text-[var(--warn-text)] font-semibold">本日締切</span>
        ) : (
          <span className="ml-2 text-[var(--muted-2)]">（あと{daysLeft}日）</span>
        )}
        {schedule.hint && (
          <span className="block text-[11px] text-[var(--muted-2)]">{schedule.hint}</span>
        )}
      </div>
      <form action={boundDelete}>
        <button className="btn-row btn-row-danger flex-none">削除</button>
      </form>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { toJstDateKey } from "@/lib/format";
import { Icon } from "@/components/Icons";

export interface CalendarDeadlineItem {
  id: string;
  title: string;
  date: string;
  hint?: string;
  daysLeftLabel: string;
  overdue: boolean;
  dueToday: boolean;
}

export interface CalendarPersonalItem {
  id: string;
  title: string;
  date: string;
  color: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const DEADLINE_COLOR = "#dc2626";

interface AddEventState {
  error?: string;
  success?: string;
}

export function MonthCalendar({
  accent,
  deadlines,
  personalEvents,
  addEventAction,
  deleteEventAction,
}: {
  accent: "admin" | "group";
  deadlines: CalendarDeadlineItem[];
  personalEvents: CalendarPersonalItem[];
  addEventAction?: (
    prevState: AddEventState,
    formData: FormData
  ) => Promise<AddEventState>;
  deleteEventAction?: (id: string) => void | Promise<void>;
}) {
  const accentText = accent === "admin" ? "var(--accent-admin-text)" : "var(--accent-group-text)";
  const accentSoftBg =
    accent === "admin" ? "var(--accent-admin-soft-bg)" : "var(--accent-group-soft-bg)";
  const btnClass = accent === "admin" ? "btn-admin" : "btn-group";

  const todayKey = toJstDateKey(new Date().toISOString());
  const [todayYearStr, todayMonthStr] = todayKey.split("-");
  const [viewYear, setViewYear] = useState(Number(todayYearStr));
  const [viewMonth, setViewMonth] = useState(Number(todayMonthStr));

  const byDay = useMemo(() => {
    const map = new Map<string, { color: string; title: string }[]>();
    for (const d of deadlines) {
      const key = toJstDateKey(d.date);
      const arr = map.get(key);
      const entry = { color: DEADLINE_COLOR, title: `締切: ${d.title}` };
      if (arr) arr.push(entry);
      else map.set(key, [entry]);
    }
    for (const p of personalEvents) {
      const key = toJstDateKey(p.date);
      const arr = map.get(key);
      const entry = { color: p.color, title: p.title };
      if (arr) arr.push(entry);
      else map.set(key, [entry]);
    }
    return map;
  }, [deadlines, personalEvents]);

  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(viewYear, viewMonth - 1, 1)).getUTCDay();

  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      key: `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function goNextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function goToday() {
    setViewYear(Number(todayYearStr));
    setViewMonth(Number(todayMonthStr));
  }

  const upcomingDeadlines = [...deadlines].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const upcomingPersonal = [...personalEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="card-heading">カレンダー</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="前の月"
            className="w-7 h-7 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--background)]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="text-[11.5px] font-semibold px-2 h-7 rounded-md hover:bg-[var(--background)]"
            style={{ color: accentText }}
          >
            {viewYear}年{viewMonth}月
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="次の月"
            className="w-7 h-7 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--background)]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10.5px] font-semibold text-[var(--muted-2)] py-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const items = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          return (
            <div
              key={cell.key}
              className={`rounded-lg px-1 py-1.5 min-h-[52px] text-left ${
                isToday ? "" : "bg-[var(--background)]"
              }`}
              style={isToday ? { background: accentSoftBg } : undefined}
            >
              <div
                className="text-[11px] leading-none font-semibold"
                style={{ color: isToday ? accentText : "var(--muted)" }}
              >
                {cell.day}
              </div>
              {items.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {items.slice(0, 4).map((it, idx) => (
                    <span
                      key={idx}
                      title={it.title}
                      className="w-1.5 h-1.5 rounded-full flex-none"
                      style={{ background: it.color }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 pt-1 border-t border-[var(--border)]">
        {upcomingDeadlines.length === 0 && upcomingPersonal.length === 0 ? (
          <p className="text-[12.5px] text-[var(--muted-2)] inline-flex items-center gap-1.5">
            <Icon name="calendar" className="w-3.5 h-3.5 text-[var(--muted-2)]" />
            まだ予定は登録されていません
          </p>
        ) : (
          <div className="space-y-1.5">
            {upcomingDeadlines.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-[12.5px] py-0.5">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-none"
                    style={{ background: DEADLINE_COLOR }}
                  />
                  <span className="truncate">{d.title}</span>
                </span>
                <span className="text-[11px] text-[var(--muted-2)] whitespace-nowrap flex-none">
                  {d.date.slice(0, 10)}
                  <span
                    className={`ml-1.5 ${
                      d.overdue
                        ? "text-[var(--danger-text)] font-semibold"
                        : d.dueToday
                        ? "text-[var(--warn-text)] font-semibold"
                        : ""
                    }`}
                  >
                    {d.daysLeftLabel}
                  </span>
                </span>
              </div>
            ))}
            {upcomingPersonal.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-[12.5px] py-0.5">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: p.color }} />
                  <span className="truncate">{p.title}</span>
                </span>
                <span className="flex items-center gap-2 flex-none">
                  <span className="text-[11px] text-[var(--muted-2)] whitespace-nowrap">
                    {p.date.slice(0, 10)}
                  </span>
                  {deleteEventAction && (
                    <button
                      type="button"
                      onClick={() => deleteEventAction(p.id)}
                      aria-label={`${p.title}を削除`}
                      className="text-[var(--muted-2)] text-[13px] leading-none"
                    >
                      ×
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {addEventAction && (
        <AddEventForm addEventAction={addEventAction} btnClass={btnClass} />
      )}
    </div>
  );
}

function AddEventForm({
  addEventAction,
  btnClass,
}: {
  addEventAction: (prevState: AddEventState, formData: FormData) => Promise<AddEventState>;
  btnClass: string;
}) {
  const [state, formAction, pending] = useActionState(addEventAction, {} as AddEventState);

  return (
    <details className="pt-1 border-t border-[var(--border)]">
      <summary
        className="cursor-pointer text-[11.5px] font-semibold"
        style={{ color: "var(--muted)" }}
      >
        ＋ 予定を追加
      </summary>
      <form
        action={formAction}
        noValidate
        key={state.success}
        className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 mt-2 items-center"
      >
        <input
          name="title"
          required
          placeholder="予定の名前（例: 前日準備）"
          className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
        />
        <input
          type="date"
          name="event_date"
          required
          aria-label="日付"
          className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
        />
        <input
          type="color"
          name="color"
          defaultValue="#2563eb"
          aria-label="色"
          className="h-9 w-9 border border-[var(--border-strong)] rounded-md p-0.5"
        />
        <button
          disabled={pending}
          className={`h-9 px-4 rounded-md text-[12.5px] font-semibold whitespace-nowrap disabled:opacity-60 ${btnClass}`}
        >
          追加
        </button>
      </form>
      {state.error && <p className="text-[12px] text-[var(--danger-text)] mt-1.5">{state.error}</p>}
    </details>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

interface AgendaItem {
  id: string;
  title: string;
  color: string;
  kind: "deadline" | "personal";
  daysLeftLabel?: string;
  overdue?: boolean;
  dueToday?: boolean;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const DEADLINE_COLOR = "#dc2626";
const SWIPE_THRESHOLD_PX = 50;

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
  const accentSolid = accent === "admin" ? "var(--accent-admin-solid)" : "var(--accent-group-solid)";
  const btnClass = accent === "admin" ? "btn-admin" : "btn-group";

  const todayKey = toJstDateKey(new Date().toISOString());
  const [todayYearStr, todayMonthStr] = todayKey.split("-");
  const [viewYear, setViewYear] = useState(Number(todayYearStr));
  const [viewMonth, setViewMonth] = useState(Number(todayMonthStr));
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const byDay = useMemo(() => {
    const map = new Map<string, AgendaItem[]>();
    for (const d of deadlines) {
      const key = toJstDateKey(d.date);
      const entry: AgendaItem = {
        id: d.id,
        title: d.title,
        color: DEADLINE_COLOR,
        kind: "deadline",
        daysLeftLabel: d.daysLeftLabel,
        overdue: d.overdue,
        dueToday: d.dueToday,
      };
      const arr = map.get(key);
      if (arr) arr.push(entry);
      else map.set(key, [entry]);
    }
    for (const p of personalEvents) {
      const key = toJstDateKey(p.date);
      const entry: AgendaItem = { id: p.id, title: p.title, color: p.color, kind: "personal" };
      const arr = map.get(key);
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
    setSelectedDay(todayKey);
  }

  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (deltaX > SWIPE_THRESHOLD_PX) goPrevMonth();
    else if (deltaX < -SWIPE_THRESHOLD_PX) goNextMonth();
  }

  const selectedDayLabel = useMemo(() => {
    const [y, m, d] = selectedDay.split("-").map(Number);
    const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${m}月${d}日(${weekday})`;
  }, [selectedDay]);
  const selectedDayItems = byDay.get(selectedDay) ?? [];

  return (
    <div className="card p-6 space-y-4 relative">
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

      <div
        className="grid grid-cols-7 gap-1 text-center touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10.5px] font-semibold text-[var(--muted-2)] py-1">
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const items = byDay.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const isSelected = cell.key === selectedDay;
          return (
            <button
              type="button"
              key={cell.key}
              onClick={() => setSelectedDay(cell.key)}
              className="rounded-lg px-0.5 py-1.5 min-h-[56px] text-left flex flex-col items-stretch"
              style={{
                background: isToday ? accentSoftBg : "var(--background)",
                outline: isSelected ? `2px solid ${accentSolid}` : undefined,
                outlineOffset: isSelected ? "-2px" : undefined,
              }}
            >
              <div
                className="text-[11px] leading-none font-semibold px-1"
                style={{ color: isToday ? accentText : "var(--muted)" }}
              >
                {cell.day}
              </div>
              {items.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 2).map((it, idx) => (
                    <div
                      key={idx}
                      title={it.title}
                      className="text-[8.5px] leading-tight text-white rounded-sm px-0.5 truncate font-medium"
                      style={{ background: it.color }}
                    >
                      {it.title}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <div className="text-[8.5px] leading-tight text-[var(--muted-2)] px-0.5">
                      +{items.length - 2}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-1 border-t border-[var(--border)] space-y-2">
        <div className="text-[12px] font-bold text-[var(--foreground)]">{selectedDayLabel}の予定</div>
        {selectedDayItems.length === 0 ? (
          <p className="text-[12.5px] text-[var(--muted-2)] inline-flex items-center gap-1.5">
            <Icon name="calendar" className="w-3.5 h-3.5 text-[var(--muted-2)]" />
            予定はありません
          </p>
        ) : (
          <div className="space-y-1.5">
            {selectedDayItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-2 text-[12.5px] py-0.5">
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: it.color }} />
                  <span className="truncate">
                    {it.kind === "deadline" ? `締切: ${it.title}` : it.title}
                  </span>
                </span>
                <span className="flex items-center gap-2 flex-none">
                  {it.kind === "deadline" && (
                    <span
                      className={`text-[11px] whitespace-nowrap ${
                        it.overdue
                          ? "text-[var(--danger-text)] font-semibold"
                          : it.dueToday
                          ? "text-[var(--warn-text)] font-semibold"
                          : "text-[var(--muted-2)]"
                      }`}
                    >
                      {it.daysLeftLabel}
                    </span>
                  )}
                  {it.kind === "personal" && deleteEventAction && (
                    <button
                      type="button"
                      onClick={() => deleteEventAction(it.id)}
                      aria-label={`${it.title}を削除`}
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
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          aria-label="予定を追加"
          className={`absolute bottom-4 right-4 w-11 h-11 rounded-full text-[22px] font-light flex items-center justify-center shadow-lg ${btnClass}`}
        >
          +
        </button>
      )}

      {addEventAction && addModalOpen && (
        <AddEventModal
          addEventAction={addEventAction}
          btnClass={btnClass}
          defaultDate={selectedDay}
          onClose={() => setAddModalOpen(false)}
        />
      )}
    </div>
  );
}

function AddEventModal({
  addEventAction,
  btnClass,
  defaultDate,
  onClose,
}: {
  addEventAction: (prevState: AddEventState, formData: FormData) => Promise<AddEventState>;
  btnClass: string;
  defaultDate: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(addEventAction, {} as AddEventState);

  useEffect(() => {
    if (!state.success) return;
    (async () => {
      await Promise.resolve();
      onClose();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="card p-5 w-full max-w-sm space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="card-heading">予定を追加</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-[var(--muted-2)] text-[18px] leading-none"
          >
            ×
          </button>
        </div>
        <form action={formAction} noValidate className="space-y-2.5">
          <input
            name="title"
            required
            autoFocus
            placeholder="予定の名前（例: 前日準備）"
            className="w-full h-10 border border-[var(--input-border)] rounded-md px-2.5 text-[13px]"
          />
          <div className="flex gap-2">
            <input
              type="date"
              name="event_date"
              required
              defaultValue={defaultDate}
              aria-label="日付"
              className="flex-1 h-10 border border-[var(--input-border)] rounded-md px-2.5 text-[13px]"
            />
            <input
              type="color"
              name="color"
              defaultValue="#2563eb"
              aria-label="色"
              className="h-10 w-10 border border-[var(--input-border)] rounded-md p-0.5 flex-none"
            />
          </div>
          <button
            disabled={pending}
            className={`w-full h-10 rounded-md text-[13px] font-semibold disabled:opacity-60 ${btnClass}`}
          >
            追加
          </button>
        </form>
        {state.error && <p className="text-[12px] text-[var(--danger-text)]">{state.error}</p>}
      </div>
    </div>
  );
}

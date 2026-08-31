import { daysUntil, formatDateTime, toJstDateKey } from "@/lib/format";
import { Icon } from "@/components/Icons";

interface ScheduleLite {
  id: string;
  title: string;
  deadline: string;
  hint: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function DeadlineCalendar({ schedules }: { schedules: ScheduleLite[] }) {
  const todayKey = toJstDateKey(new Date().toISOString());
  const [yearStr, monthStr] = todayKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  const byDay = new Map<string, ScheduleLite[]>();
  for (const s of schedules) {
    const key = toJstDateKey(s.deadline);
    const arr = byDay.get(key);
    if (arr) arr.push(s);
    else byDay.set(key, [s]);
  }

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const cells: ({ day: number; key: string } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `${yearStr}-${monthStr}-${String(d).padStart(2, "0")}` });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const sorted = [...schedules].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
  );

  return (
    <div className="card p-6 space-y-4">
      <div>
        <div className="card-heading">締切カレンダー</div>
        <p className="text-[11.5px] text-[var(--muted-2)] mt-0.5">
          {year}年{month}月。締切のある日には件数が表示されます。
        </p>
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
                isToday ? "bg-[var(--accent-admin-soft-bg)]" : "bg-[var(--background)]"
              }`}
            >
              <div
                className={`text-[11px] leading-none ${
                  isToday ? "font-bold text-[var(--accent-admin-text)]" : "text-[var(--muted)]"
                }`}
              >
                {cell.day}
              </div>
              {items.length > 0 && (
                <div className="mt-1 text-[9.5px] font-semibold text-white bg-[var(--danger-text)] rounded px-1 py-0.5 inline-block">
                  締切{items.length}件
                </div>
              )}
            </div>
          );
        })}
      </div>

      {sorted.length === 0 ? (
        <p className="text-[12.5px] text-[var(--muted-2)] inline-flex items-center gap-1.5">
          <Icon name="calendar" className="w-3.5 h-3.5 text-[var(--muted-2)]" />
          まだ締切は登録されていません
        </p>
      ) : (
        <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
          {sorted.map((s) => {
            const remaining = daysUntil(s.deadline);
            return (
              <div key={s.id} className="flex items-center justify-between gap-2 text-[12.5px] py-1">
                <span className="truncate">{s.title}</span>
                <span className="text-[11px] text-[var(--muted-2)] whitespace-nowrap">
                  {formatDateTime(s.deadline)}
                  <span
                    className={`ml-1.5 ${
                      remaining < 0
                        ? "text-[var(--danger-text)] font-semibold"
                        : remaining === 0
                        ? "text-[var(--warn-text)] font-semibold"
                        : ""
                    }`}
                  >
                    {remaining < 0 ? "超過" : remaining === 0 ? "本日" : `あと${remaining}日`}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

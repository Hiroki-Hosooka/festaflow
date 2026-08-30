export function BudgetBar({ allocated, planned }: { allocated: number; planned: number }) {
  const ratio = allocated > 0 ? planned / allocated : planned > 0 ? 1 : 0;
  const pct = Math.min(100, ratio * 100);
  const over = planned > allocated;

  return (
    <div className="card px-4 py-3.5">
      <div className="flex justify-between text-xs text-[var(--muted)] mb-1.5">
        <span>配分予算 ¥{allocated.toLocaleString()}</span>
        <span className={over ? "text-[var(--danger-text)] font-semibold" : ""}>
          使用予定 ¥{planned.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: over ? "oklch(55% 0.18 30)" : "var(--accent-group-solid)",
          }}
        />
      </div>
      {over && (
        <p className="mt-1.5 text-xs text-[var(--danger-text)] font-medium">
          予算を ¥{(planned - allocated).toLocaleString()} 超過しています
        </p>
      )}
    </div>
  );
}

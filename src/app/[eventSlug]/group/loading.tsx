export default function GroupLoading() {
  return (
    <div className="space-y-5 animate-pulse" aria-hidden="true">
      <div className="h-5 w-40 rounded bg-[var(--border)]" />
      <div className="card h-[52px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-[76px]" />
        ))}
      </div>
    </div>
  );
}

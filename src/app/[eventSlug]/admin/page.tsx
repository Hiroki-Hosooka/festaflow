import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { StatusBadge, type DisplayStatus } from "@/components/StatusBadge";
import { yen } from "@/lib/format";

type Filter = "all" | "unsubmitted" | "pending";

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { eventSlug } = await params;
  const { filter: filterParam } = await searchParams;
  const auth = await requireAdminSession(eventSlug);

  const rows = await listSubmissionsForAdmin(auth.eventId);

  const submittedCount = rows.filter((r) => r.status && r.status !== "draft").length;
  const pendingCount = rows.filter((r) => r.status === "submitted").length;

  const filter: Filter =
    filterParam === "unsubmitted" || filterParam === "pending" ? filterParam : "all";

  const filtered = rows.filter((r) => {
    if (filter === "unsubmitted") return !r.status || r.status === "draft";
    if (filter === "pending") return r.status === "submitted";
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-bold">企画一覧</h1>
        <div className="flex gap-5 text-[13px] text-[var(--muted)]">
          <span>
            提出済み{" "}
            <strong className="text-[var(--foreground)]">
              {submittedCount}/{rows.length}団体
            </strong>
          </span>
          <span>
            確認待ち <strong className="text-[var(--foreground)]">{pendingCount}件</strong>
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <FilterChip eventSlug={eventSlug} value="all" active={filter === "all"}>
          すべて
        </FilterChip>
        <FilterChip eventSlug={eventSlug} value="unsubmitted" active={filter === "unsubmitted"}>
          未提出
        </FilterChip>
        <FilterChip eventSlug={eventSlug} value="pending" active={filter === "pending"}>
          要確認
        </FilterChip>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[110px_1fr_130px_100px_60px] px-4 py-2.5 text-[10.5px] font-bold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
          <span>団体</span>
          <span>企画名</span>
          <span>予算（使用/配分）</span>
          <span>状態</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">該当する団体がありません。</p>
        )}
        {filtered.map((row) => {
          const status: DisplayStatus = row.status ?? "unsubmitted";
          return (
            <div
              key={row.groupId}
              className="grid grid-cols-[110px_1fr_130px_100px_60px] px-4 py-3 items-center text-[12.5px] border-b border-[var(--border)] last:border-b-0"
            >
              <span className="inline-flex items-center gap-1.5">
                {row.groupName}
                {row.hasUnreadFromGroup && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
                    aria-label="団体からの未読コメントがあります"
                  />
                )}
              </span>
              <span className={row.name ? "" : "text-[var(--muted-2)]"}>
                {row.name || "—"}
              </span>
              <span className="text-[11px]">
                {row.submissionId
                  ? `${yen(row.plannedTotal)}/${yen(row.budgetAllocated)}`
                  : "—"}
              </span>
              <span>
                <StatusBadge status={status} />
              </span>
              {row.submissionId ? (
                <Link
                  href={`/${eventSlug}/admin/submissions/${row.submissionId}`}
                  className="text-[var(--accent-admin-text)] font-semibold text-[11.5px]"
                >
                  確認
                </Link>
              ) : (
                <Link
                  href={`/${eventSlug}/admin/broadcasts?target=unsubmitted`}
                  className="text-[var(--accent-admin-text)] font-semibold text-[11.5px]"
                >
                  催促
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  eventSlug,
  value,
  active,
  children,
}: {
  eventSlug: string;
  value: Filter;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`/${eventSlug}/admin${value === "all" ? "" : `?filter=${value}`}`}
      className={`text-[11.5px] px-3 py-1.5 rounded-full ${
        active
          ? "font-bold text-white"
          : "text-[var(--muted)] bg-[var(--background)]"
      }`}
      style={
        active
          ? {
              background:
                "linear-gradient(135deg, var(--accent-admin-from), var(--accent-admin-to))",
            }
          : undefined
      }
    >
      {children}
    </Link>
  );
}

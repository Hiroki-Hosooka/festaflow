import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { getEventBySlug } from "@/lib/data/events";
import { formatDateTime, daysUntil, toJstDatetimeLocalValue } from "@/lib/format";
import { updateDeadlineAction, clearDeadlineAction } from "./actions";
import { SubmissionsList } from "./SubmissionsList";

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

  const [rows, event] = await Promise.all([
    listSubmissionsForAdmin(auth.eventId),
    getEventBySlug(eventSlug),
  ]);

  const submittedCount = rows.filter((r) => r.status && r.status !== "draft").length;
  const pendingCount = rows.filter((r) => r.status === "submitted").length;
  const progressPct = rows.length > 0 ? Math.round((submittedCount / rows.length) * 100) : 0;

  const boundUpdateDeadline = updateDeadlineAction.bind(null, eventSlug);
  const boundClearDeadline = clearDeadlineAction.bind(null, eventSlug);
  const deadline = event?.submission_deadline ?? null;
  const daysLeft = deadline ? daysUntil(deadline) : null;

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

      <div className="card px-4 py-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11.5px] text-[var(--muted)]">
          <span>提出の進み具合</span>
          <span className="font-semibold text-[var(--foreground)]">
            {submittedCount}/{rows.length}団体（{progressPct}%）
          </span>
        </div>
        <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(135deg, var(--accent-admin-from), var(--accent-admin-to))",
            }}
          />
        </div>
      </div>

      <div className="card px-4 py-3 flex items-center justify-between flex-wrap gap-3 text-[13px]">
        <div>
          <span className="text-[var(--muted)]">提出締切　</span>
          {deadline ? (
            <>
              <strong>{formatDateTime(deadline)}</strong>
              {daysLeft !== null && daysLeft < 0 && (
                <span className="ml-2 text-[11px] text-[var(--danger-text)] font-semibold">
                  締切を過ぎています
                </span>
              )}
              {daysLeft !== null && daysLeft === 0 && (
                <span className="ml-2 text-[11px] text-[var(--warn-text)] font-semibold">
                  本日締切
                </span>
              )}
              {daysLeft !== null && daysLeft > 0 && (
                <span className="ml-2 text-[11px] text-[var(--muted)]">（あと{daysLeft}日）</span>
              )}
            </>
          ) : (
            <span className="text-[var(--muted-2)]">未設定</span>
          )}
        </div>
        <details>
          <summary className="cursor-pointer text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
            締切を設定・変更
          </summary>
          <form action={boundUpdateDeadline} className="flex items-center gap-2 mt-2 flex-wrap">
            <input
              type="datetime-local"
              name="deadline"
              defaultValue={toJstDatetimeLocalValue(deadline)}
              aria-label="提出締切（日本時間）"
              className="h-8 border border-[var(--border-strong)] rounded-md px-2 text-[12px]"
            />
            <button className="h-8 px-3 rounded-md text-[11.5px] font-semibold btn-admin">
              保存
            </button>
            {deadline && (
              <button
                formAction={boundClearDeadline}
                className="h-8 px-3 rounded-md text-[11.5px] text-[var(--muted)] border border-[var(--border)]"
              >
                締切を削除
              </button>
            )}
          </form>
        </details>
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

      <SubmissionsList eventSlug={eventSlug} rows={filtered} />
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

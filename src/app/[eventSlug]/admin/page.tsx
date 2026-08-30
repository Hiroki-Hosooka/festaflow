import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { listInboxThreads } from "@/lib/data/comments";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { daysUntil, formatDateTime } from "@/lib/format";
import { HubTile } from "@/components/HubTile";

export default async function AdminHubPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);

  const [event, rows, inboxThreads, inventoryUsage, schedules] = await Promise.all([
    getEventBySlug(eventSlug),
    listSubmissionsForAdmin(auth.eventId),
    listInboxThreads(auth.eventId),
    getInventoryUsage(auth.eventId),
    listSubmissionSchedules(auth.eventId),
  ]);

  const submittedCount = rows.filter((r) => r.status && r.status !== "draft").length;
  const pendingCount = rows.filter((r) => r.status === "submitted").length;
  const unreadCount = inboxThreads.filter((t) => t.hasUnreadFromGroup).length;
  const hasInventoryConflict = Array.from(inventoryUsage.values()).some(
    (u) => u.requestedTotal > u.totalQuantity
  );

  const upcoming = [...schedules].sort(
    (a, b) => daysUntil(a.deadline) - daysUntil(b.deadline)
  )[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">{event?.name ?? "管理画面"}</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1">
          実行委員会向けのホームです。ここから各機能にアクセスできます。
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="提出済み" value={`${submittedCount}/${rows.length}団体`} />
        <StatTile
          label="確認待ち"
          value={`${pendingCount}件`}
          tone={pendingCount > 0 ? "warn" : "neutral"}
        />
        <StatTile
          label="未読コメント"
          value={`${unreadCount}件`}
          tone={unreadCount > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label="在庫"
          value={hasInventoryConflict ? "競合あり" : "問題なし"}
          tone={hasInventoryConflict ? "danger" : "neutral"}
        />
      </div>

      {upcoming && (
        <div className="card px-4 py-3.5 flex items-center justify-between gap-3 text-[13px] flex-wrap">
          <span>
            直近の締切: <strong>{upcoming.title}</strong>
            <span className="text-[var(--muted)] ml-1.5">{formatDateTime(upcoming.deadline)}</span>
          </span>
          <Link
            href={`/${eventSlug}/admin/submissions`}
            className="text-[var(--accent-admin-text)] font-semibold text-[12px] whitespace-nowrap"
          >
            詳細を見る →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/submissions`}
          icon="clipboard"
          label="企画一覧"
          description="団体ごとの提出状況を確認・承認します"
          badgeCount={pendingCount}
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/inbox`}
          icon="inbox"
          label="受信箱"
          description="団体からの個別コメントを新着順に確認します"
          badgeCount={unreadCount}
          badgeTone="danger"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/broadcasts`}
          icon="megaphone"
          label="連絡"
          description="全体連絡・未提出団体へのリマインドを送ります"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/inventory`}
          icon="package"
          label="在庫管理"
          description="借用物品の在庫と希望の競合を管理します"
          badgeCount={hasInventoryConflict ? 1 : 0}
          badgeTone="danger"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/settings`}
          icon="settings"
          label="設定"
          description="団体・予算、提出項目、分類、配布資料を管理します"
        />
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-[var(--danger-text)]"
      : tone === "warn"
      ? "text-[var(--warn-text)]"
      : "text-[var(--foreground)]";
  return (
    <div className="card px-3.5 py-3">
      <div className="text-[10.5px] text-[var(--muted)] font-semibold">{label}</div>
      <div className={`text-[17px] font-bold mt-0.5 ${toneClass}`}>{value}</div>
    </div>
  );
}

import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { listInboxThreads } from "@/lib/data/comments";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { formatRelativeTime } from "@/lib/format";
import { HubTile } from "@/components/HubTile";
import { Icon } from "@/components/Icons";
import { DeadlineCalendar } from "./DeadlineCalendar";

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

  const latestThreads = inboxThreads.slice(0, 3);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold">{event?.name ?? "管理画面"}</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1">
          {event?.admin_label ?? "実行委員会"}向けのホームです。ここから各機能にアクセスできます。
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

      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-bold text-[var(--muted)]">連絡</div>
          <Link
            href={`/${eventSlug}/admin/messages`}
            className="text-[12px] font-semibold text-[var(--accent-admin-text)]"
          >
            すべて見る →
          </Link>
        </div>

        {latestThreads.length === 0 ? (
          <p className="text-[12.5px] text-[var(--muted-2)]">まだやりとりはありません。</p>
        ) : (
          <div className="space-y-1">
            {latestThreads.map((t) => (
              <Link
                key={t.submissionId}
                href={`/${eventSlug}/admin/submissions/${t.submissionId}`}
                className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-[var(--background)] text-[12.5px]"
              >
                <span className="truncate inline-flex items-center gap-1.5">
                  {t.hasUnreadFromGroup && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
                      aria-label="未読"
                    />
                  )}
                  <span className="font-semibold flex-none">{t.groupName}</span>
                  <span className="text-[var(--muted)] truncate">{t.lastMessage}</span>
                </span>
                <span className="text-[10.5px] text-[var(--muted-2)] whitespace-nowrap flex-none">
                  {formatRelativeTime(t.lastMessageAt)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1 border-t border-[var(--border)]">
          <Link
            href={`/${eventSlug}/admin/messages?tab=broadcast`}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--accent-admin-text)] pt-2.5"
          >
            <span aria-hidden="true" className="inline-flex w-4 h-4">
              <Icon name="megaphone" />
            </span>
            全体連絡を送る
          </Link>
        </div>
      </div>

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
          href={`/${eventSlug}/admin/messages`}
          icon="inbox"
          label="連絡"
          description="個別コメントの確認・全体連絡の送信を行います"
          badgeCount={unreadCount}
          badgeTone="danger"
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

      <DeadlineCalendar schedules={schedules} />
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

import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listInboxThreads } from "@/lib/data/comments";
import { listBroadcasts } from "@/lib/data/broadcasts";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { formatRelativeTime, formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { sendBroadcastAction } from "./actions";

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ tab?: string; target?: string }>;
}) {
  const { eventSlug } = await params;
  const { tab: tabParam, target: targetParam } = await searchParams;
  const auth = await requireAdminSession(eventSlug);
  const tab = tabParam === "broadcast" ? "broadcast" : "inbox";

  if (tab === "broadcast") {
    const target = targetParam === "unsubmitted" ? "unsubmitted" : "all";
    const [broadcasts, rows] = await Promise.all([
      listBroadcasts(auth.eventId),
      listSubmissionsForAdmin(auth.eventId),
    ]);
    const unsubmittedCount = rows.filter((r) => !r.status || r.status === "draft").length;
    const boundSend = sendBroadcastAction.bind(null, eventSlug);

    return (
      <div className="space-y-5">
        <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "連絡" }]} />
        <h1 className="page-title">連絡</h1>
        <Tabs eventSlug={eventSlug} active={tab} />

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
          <div className="card p-6 space-y-4">
            <div className="flex gap-5 border-b border-[var(--border)]">
              <Link
                href={`/${eventSlug}/admin/messages?tab=broadcast&target=all`}
                className={`pb-2.5 text-[13px] ${
                  target === "all"
                    ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
                    : "text-[var(--muted)]"
                }`}
              >
                一斉連絡
              </Link>
              <Link
                href={`/${eventSlug}/admin/messages?tab=broadcast&target=unsubmitted`}
                className={`pb-2.5 text-[13px] ${
                  target === "unsubmitted"
                    ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
                    : "text-[var(--muted)]"
                }`}
              >
        未提出団体へのリマインド
              </Link>
            </div>

            <form action={boundSend} className="space-y-3.5">
              <input type="hidden" name="target_type" value={target} />
              <div>
                <label className="block text-xs font-semibold mb-1.5">宛先</label>
                <div className="h-10 border border-[var(--border)] rounded-lg flex items-center px-3.5 text-[13px] bg-[var(--accent-admin-soft-bg)] text-[var(--accent-admin-text)] font-semibold">
                  {target === "all"
                    ? `すべての団体（${rows.length}団体）`
                    : `未提出の団体（${unsubmittedCount}団体）`}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">本文</label>
                <textarea
                  name="body"
                  required
                  rows={3}
                  className="w-full border border-[var(--border-strong)] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed"
                />
              </div>
              <div className="flex justify-end">
                <button className="btn-admin h-10 px-6 rounded-lg text-[13px] font-bold">送信</button>
              </div>
            </form>
          </div>

          <div className="card p-6">
            <div className="card-heading mb-3">送信履歴</div>
            <div className="border-t border-[var(--border)]">
              {broadcasts.length === 0 && (
                <EmptyState icon="megaphone" title="まだ送信履歴はありません" />
              )}
              {broadcasts.map((b) => (
                <div
                  key={b.id}
                  className="py-3 border-b border-[var(--border)] last:border-b-0 flex flex-col gap-1 text-[12.5px]"
                >
                  <span>{b.body}</span>
                  <span className="text-[10.5px] text-[var(--muted-2)]">
                    {b.target_type === "all" ? "全体" : "未提出団体"} ・{" "}
                    {formatDateTime(b.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const threads = await listInboxThreads(auth.eventId);
  const unreadCount = threads.filter((t) => t.hasUnreadFromGroup).length;

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "連絡" }]} />
      <div>
        <h1 className="page-title">連絡</h1>
      </div>
      <Tabs eventSlug={eventSlug} active={tab} />

      <div>
        <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
          全団体からの個別コメントを新着順にまとめて表示します。直前に問い合わせが増えても、ここから漏れなく確認できます。
          {unreadCount > 0 && (
            <span className="text-[var(--accent-admin-text)] font-semibold"> 未読 {unreadCount}件</span>
          )}
        </p>
      </div>

      <div className="card overflow-hidden divide-y divide-[var(--border)]">
        {threads.length === 0 && (
          <EmptyState
            icon="inbox"
            title="まだやりとりはありません"
            description="団体からの個別コメントが届くと、ここに新着順で表示されます。"
          />
        )}
        {threads.map((t) => (
          <Link
            key={t.submissionId}
            href={`/${eventSlug}/admin/submissions/${t.submissionId}`}
            className="block px-4 py-3.5 hover:bg-[var(--background)]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[13px] inline-flex items-center gap-1.5">
                {t.groupName}
                {t.hasUnreadFromGroup && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
                    aria-label="未読のコメントがあります"
                  />
                )}
              </span>
              <span className="text-[10.5px] text-[var(--muted-2)] whitespace-nowrap">
                {formatRelativeTime(t.lastMessageAt)}
              </span>
            </div>
            <p className="text-[11.5px] text-[var(--muted)] mt-0.5">
              {t.submissionName || "（企画名未入力）"}
            </p>
            <p className="text-[12.5px] mt-1 leading-relaxed truncate">
              {t.lastSender === "admin" && (
                <span className="text-[var(--muted-2)]">委員会: </span>
              )}
              {t.lastMessage}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Tabs({ eventSlug, active }: { eventSlug: string; active: "inbox" | "broadcast" }) {
  return (
    <div className="flex gap-5 border-b border-[var(--border)]">
      <Link
        href={`/${eventSlug}/admin/messages`}
        className={`pb-2.5 text-[13px] ${
          active === "inbox"
            ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
            : "text-[var(--muted)]"
        }`}
      >
        受信箱
      </Link>
      <Link
        href={`/${eventSlug}/admin/messages?tab=broadcast`}
        className={`pb-2.5 text-[13px] ${
          active === "broadcast"
            ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
            : "text-[var(--muted)]"
        }`}
      >
        全体連絡
      </Link>
    </div>
  );
}

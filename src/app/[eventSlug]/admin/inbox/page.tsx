import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listInboxThreads } from "@/lib/data/comments";
import { formatRelativeTime } from "@/lib/format";

export default async function AdminInboxPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);

  const threads = await listInboxThreads(auth.eventId);
  const unreadCount = threads.filter((t) => t.hasUnreadFromGroup).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold">受信箱</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
          全団体からの個別コメントを新着順にまとめて表示します。直前に問い合わせが増えても、ここから漏れなく確認できます。
          {unreadCount > 0 && (
            <span className="text-[var(--accent-admin-text)] font-semibold"> 未読 {unreadCount}件</span>
          )}
        </p>
      </div>

      <div className="card overflow-hidden divide-y divide-[var(--border)]">
        {threads.length === 0 && (
          <p className="px-4 py-8 text-sm text-[var(--muted)] text-center">
            まだやりとりはありません。団体からコメントが届くとここに表示されます。
          </p>
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

import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listInboxThreads } from "@/lib/data/comments";
import { listBroadcasts } from "@/lib/data/broadcasts";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { listGroups } from "@/lib/data/groups";
import { listMessageAttachmentsByBroadcastIds } from "@/lib/data/messageAttachments";
import { createSignedUrls } from "@/lib/storage";
import { MessageAttachmentList } from "@/components/MessageAttachmentList";
import { Icon } from "@/components/Icons";
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
    const target =
      targetParam === "unsubmitted" || targetParam === "custom" ? targetParam : "all";
    const [broadcasts, rows, groups] = await Promise.all([
      listBroadcasts(auth.eventId),
      listSubmissionsForAdmin(auth.eventId),
      listGroups(auth.eventId),
    ]);
    const attachmentsByBroadcast = await listMessageAttachmentsByBroadcastIds(
      broadcasts.map((b) => b.id)
    );
    const allAttachments = Array.from(attachmentsByBroadcast.values()).flat();
    const signedUrlsByPath = await createSignedUrls(allAttachments.map((a) => a.storage_path));
    const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));
    const unsubmittedCount = rows.filter((r) => !r.status || r.status === "draft").length;
    const boundSend = sendBroadcastAction.bind(null, eventSlug);

    return (
      <div className="space-y-5">
        <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "連絡" }]} />
        <h1 className="page-title">連絡</h1>
        <Tabs eventSlug={eventSlug} active={tab} />

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
          <div className="card p-6 space-y-4">
            <div className="flex gap-5 border-b border-[var(--border)] flex-wrap">
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
              <Link
                href={`/${eventSlug}/admin/messages?tab=broadcast&target=custom`}
                className={`pb-2.5 text-[13px] ${
                  target === "custom"
                    ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
                    : "text-[var(--muted)]"
                }`}
              >
                団体を選んで送信
              </Link>
            </div>

            <form action={boundSend} noValidate className="space-y-3.5">
              <input type="hidden" name="target_type" value={target} />
              {target === "custom" ? (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">宛先（複数選択可）</label>
                  <div className="border border-[var(--border-strong)] rounded-lg divide-y divide-[var(--border)] max-h-56 overflow-y-auto">
                    {(groups ?? []).length === 0 && (
                      <p className="px-3.5 py-3 text-[12.5px] text-[var(--muted)]">団体がありません。</p>
                    )}
                    {(groups ?? []).map((g) => (
                      <label
                        key={g.id}
                        className="flex items-center gap-2 px-3.5 py-2 text-[13px] cursor-pointer"
                      >
                        <input type="checkbox" name="group_ids" value={g.id} />
                        {g.name}
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1.5">宛先</label>
                  <div className="h-10 border border-[var(--border)] rounded-lg flex items-center px-3.5 text-[13px] bg-[var(--accent-admin-soft-bg)] text-[var(--accent-admin-text)] font-semibold">
                    {target === "all"
                      ? `すべての団体（${rows.length}団体）`
                      : `未提出の団体（${unsubmittedCount}団体）`}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5">重要度</label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "normal", label: "通常" },
                      { value: "important", label: "重要" },
                      { value: "urgent", label: "緊急" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.value}
                      className="flex-1 h-10 border border-[var(--border-strong)] rounded-lg flex items-center justify-center gap-1.5 text-[13px] cursor-pointer has-[:checked]:bg-[var(--accent-admin-soft-bg)] has-[:checked]:border-[var(--accent-admin-text)] has-[:checked]:font-semibold"
                    >
                      <input
                        type="radio"
                        name="severity"
                        value={opt.value}
                        defaultChecked={opt.value === "normal"}
                        className="sr-only"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">本文</label>
                <textarea
                  name="body"
                  required
                  rows={3}
                  className="w-full border border-[var(--input-border)] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">添付ファイル（任意）</label>
                <div className="file-input-wrapper">
                  <input type="file" name="files" multiple />
                </div>
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
              {broadcasts.map((b) => {
                const attachmentList = (attachmentsByBroadcast.get(b.id) ?? []).map((a) => ({
                  file_name: a.file_name,
                  url: signedUrlsByPath.get(a.storage_path) ?? "",
                }));
                return (
                  <div
                    key={b.id}
                    className="py-3 border-b border-[var(--border)] last:border-b-0 flex flex-col gap-1 text-[12.5px]"
                  >
                    {b.severity !== "normal" && (
                      <span
                        className={`status-badge mb-0.5 inline-flex items-center gap-1 w-fit ${
                          b.severity === "urgent"
                            ? "bg-[var(--status-rejected-bg)] text-[var(--danger-text)]"
                            : "bg-[var(--status-unsubmitted-bg)] text-[var(--status-unsubmitted-text)]"
                        }`}
                      >
                        <Icon name="flag" className="w-3 h-3" />
                        {b.severity === "urgent" ? "緊急" : "重要"}
                      </span>
                    )}
                    <span>{b.body}</span>
                    <MessageAttachmentList attachments={attachmentList} />
                    <span className="text-[10.5px] text-[var(--muted-2)]">
                      {b.target_type === "all"
                        ? "全体"
                        : b.target_type === "unsubmitted"
                        ? "未提出団体"
                        : `${(b.target_group_ids ?? [])
                            .map((id) => groupNameById.get(id) ?? "?")
                            .join("・")}`}
                      {" ・ "}
                      {formatDateTime(b.created_at)}
                    </span>
                  </div>
                );
              })}
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

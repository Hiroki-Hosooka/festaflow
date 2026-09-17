import Link from "next/link";
import { requireGroupSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listComments, markCommentsRead } from "@/lib/data/comments";
import { listBroadcastsForGroup } from "@/lib/data/broadcasts";
import {
  listMessageAttachmentsByBroadcastIds,
  listMessageAttachmentsByCommentIds,
} from "@/lib/data/messageAttachments";
import { createSignedUrls } from "@/lib/storage";
import { MessageAttachmentList } from "@/components/MessageAttachmentList";
import { Icon } from "@/components/Icons";
import { formatDateTime, formatTime } from "@/lib/format";
import { sendGroupCommentAction } from "./actions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import type { BroadcastSeverity } from "@/lib/database.types";

export default async function GroupMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventSlug } = await params;
  const { tab: tabParam } = await searchParams;
  const auth = await requireGroupSession(eventSlug);
  const requestedTab = tabParam === "broadcast" ? "broadcast" : "comments";
  // 一般生徒は個別コメント（質問相談チャット）を利用できないため、常に全体連絡のみ表示する
  const tab = auth.role === "member" ? "broadcast" : requestedTab;

  const boundSend = sendGroupCommentAction.bind(null, eventSlug);

  if (tab === "broadcast") {
    const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
    const isUnsubmitted = submission.status === "draft";
    const broadcasts = await listBroadcastsForGroup(auth.eventId, auth.groupId, isUnsubmitted);

    const attachmentsByBroadcast = await listMessageAttachmentsByBroadcastIds(
      broadcasts.map((b) => b.id)
    );
    const allAttachments = Array.from(attachmentsByBroadcast.values()).flat();
    const signedUrlsByPath = await createSignedUrls(allAttachments.map((a) => a.storage_path));

    const important = broadcasts.filter((b) => b.severity !== "normal");
    const normal = broadcasts.filter((b) => b.severity === "normal");

    return (
      <div className="space-y-5">
        <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/group` }, { label: "連絡" }]} />
        <h1 className="page-title">連絡</h1>
        <Tabs eventSlug={eventSlug} active={tab} role={auth.role} />

        {important.length > 0 && (
          <div>
            <div className="section-caption mb-2 text-[var(--danger-text)]">
              重要・緊急なお知らせ
            </div>
            <div className="card divide-y divide-[var(--border)] border-[var(--danger-border)]">
              {important.map((b) => (
                <BroadcastRow
                  key={b.id}
                  body={b.body}
                  createdAt={b.created_at}
                  severity={b.severity}
                  attachments={(attachmentsByBroadcast.get(b.id) ?? []).map((a) => ({
                    file_name: a.file_name,
                    url: signedUrlsByPath.get(a.storage_path) ?? "",
                  }))}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {important.length > 0 && <div className="section-caption mb-2">通常のお知らせ</div>}
          <div className="card divide-y divide-[var(--border)]">
            {normal.length === 0 && important.length === 0 && (
              <EmptyState icon="megaphone" title="まだお知らせはありません" />
            )}
            {normal.map((b) => (
              <BroadcastRow
                key={b.id}
                body={b.body}
                createdAt={b.created_at}
                severity={b.severity}
                attachments={(attachmentsByBroadcast.get(b.id) ?? []).map((a) => ({
                  file_name: a.file_name,
                  url: signedUrlsByPath.get(a.storage_path) ?? "",
                }))}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const [event, , comments] = await Promise.all([
    getEventBySlug(eventSlug),
    markCommentsRead(submission.id, "group"),
    listComments(submission.id),
  ]);
  const adminLabel = event?.admin_label ?? "実行委員会";

  const messageAttachmentsByComment = await listMessageAttachmentsByCommentIds(
    comments.map((c) => c.id)
  );
  const allCommentAttachments = Array.from(messageAttachmentsByComment.values()).flat();
  const commentSignedUrlsByPath = await createSignedUrls(
    allCommentAttachments.map((a) => a.storage_path)
  );

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/group` }, { label: "連絡" }]} />
      <h1 className="page-title">連絡</h1>
      <Tabs eventSlug={eventSlug} active={tab} role={auth.role} />
      <div className="card p-6 space-y-4">
        <p className="text-xs text-[var(--muted)]">
          {submission.name ? `企画「${submission.name}」についてのやりとり` : `${adminLabel}への個別の質問・相談です`}
        </p>

        <div className="space-y-4 min-h-[80px]">
          {comments.length === 0 && (
            <EmptyState
              icon="chat"
              title="まだやりとりはありません"
              description="気になる点があれば下のフォームからメッセージを送れます。"
            />
          )}
          {comments.map((c) => {
            const attachmentList = (messageAttachmentsByComment.get(c.id) ?? []).map((a) => ({
              file_name: a.file_name,
              url: commentSignedUrlsByPath.get(a.storage_path) ?? "",
            }));
            return c.sender_type === "admin" ? (
              <div key={c.id} className="flex gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] flex-none flex items-center justify-center text-[11px] text-[var(--muted)]">
                  委
                </span>
                <div>
                  <div className="bg-[var(--background)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
                    {c.body}
                    <MessageAttachmentList attachments={attachmentList} />
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1">
                    {adminLabel} · {formatTime(c.created_at)}
                  </div>
                </div>
              </div>
            ) : (
              <div key={c.id} className="flex justify-end">
                <div className="text-right">
                  <div className="inline-block bg-[var(--accent-group-soft-bg)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm text-left">
                    {c.body}
                    <MessageAttachmentList attachments={attachmentList} />
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1">
                    {c.read_at ? "既読 · " : ""}
                    {formatTime(c.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form action={boundSend} noValidate className="space-y-2 pt-2">
          <div className="flex gap-2">
            <input
              name="body"
              required
              placeholder="メッセージを入力..."
              className="flex-1 h-10 border border-[var(--input-border)] rounded-lg px-3.5 text-[13px]"
            />
            <button className="btn-group h-10 px-5 rounded-lg text-[13px] font-bold">送信</button>
          </div>
          <div className="file-input-wrapper">
            <input type="file" name="files" multiple />
          </div>
        </form>
      </div>
    </div>
  );
}

function BroadcastRow({
  body,
  createdAt,
  severity,
  attachments,
}: {
  body: string;
  createdAt: string;
  severity: BroadcastSeverity;
  attachments: { file_name: string; url: string }[];
}) {
  return (
    <div className="px-5 py-4 flex justify-between gap-4 text-[13px]">
      <div className="min-w-0">
        {severity !== "normal" && (
          <span
            className={`status-badge mb-1.5 inline-flex items-center gap-1 ${
              severity === "urgent"
                ? "bg-[var(--status-rejected-bg)] text-[var(--danger-text)]"
                : "bg-[var(--status-unsubmitted-bg)] text-[var(--status-unsubmitted-text)]"
            }`}
          >
            <Icon name="flag" className="w-3 h-3" />
            {severity === "urgent" ? "緊急" : "重要"}
          </span>
        )}
        <p className="leading-relaxed">{body}</p>
        <MessageAttachmentList attachments={attachments} />
      </div>
      <span className="text-[11px] text-[var(--muted-2)] whitespace-nowrap pt-0.5 flex-none">
        {formatDateTime(createdAt)}
      </span>
    </div>
  );
}

function Tabs({
  eventSlug,
  active,
  role,
}: {
  eventSlug: string;
  active: "comments" | "broadcast";
  role: "leader" | "member";
}) {
  return (
    <div className="flex gap-5 border-b border-[var(--border)]">
      <Link
        href={`/${eventSlug}/group/messages?tab=broadcast`}
        className={`pb-2.5 text-[13px] ${
          active === "broadcast"
            ? "font-bold border-b-2 border-[var(--accent-group-text)]"
            : "text-[var(--muted)]"
        }`}
      >
        全体連絡
      </Link>
      {role === "leader" && (
        <Link
          href={`/${eventSlug}/group/messages?tab=comments`}
          className={`pb-2.5 text-[13px] ${
            active === "comments"
              ? "font-bold border-b-2 border-[var(--accent-group-text)]"
              : "text-[var(--muted)]"
          }`}
        >
          個別コメント
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";
import { requireGroupSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listComments, markCommentsRead } from "@/lib/data/comments";
import { listBroadcasts } from "@/lib/data/broadcasts";
import { formatDateTime, formatTime } from "@/lib/format";
import { sendGroupCommentAction } from "./actions";

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
    const broadcasts = await listBroadcasts(auth.eventId);
    return (
      <div className="space-y-5">
        <Tabs eventSlug={eventSlug} active={tab} role={auth.role} />
        <div className="card divide-y divide-[var(--border)]">
          {broadcasts.length === 0 && (
            <p className="px-5 py-6 text-sm text-[var(--muted)]">
              まだお知らせはありません。
            </p>
          )}
          {broadcasts.map((b) => (
            <div key={b.id} className="px-5 py-4 flex justify-between gap-4 text-[13px]">
              <span className="leading-relaxed">{b.body}</span>
              <span className="text-[11px] text-[var(--muted-2)] whitespace-nowrap pt-0.5">
                {formatDateTime(b.created_at)}
              </span>
            </div>
          ))}
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

  return (
    <div className="space-y-5">
      <Tabs eventSlug={eventSlug} active={tab} role={auth.role} />
      <div className="card p-6 space-y-4">
        <p className="text-xs text-[var(--muted)]">
          企画「{submission.name || "（企画名未入力）"}」についてのやりとり
        </p>

        <div className="space-y-4 min-h-[80px]">
          {comments.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              まだやりとりはありません。気になる点があれば下からメッセージを送れます。
            </p>
          )}
          {comments.map((c) =>
            c.sender_type === "admin" ? (
              <div key={c.id} className="flex gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] flex-none flex items-center justify-center text-[11px] text-[var(--muted)]">
                  委
                </span>
                <div>
                  <div className="bg-[var(--background)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
                    {c.body}
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1">
                    {adminLabel} · {formatTime(c.created_at)}
                  </div>
                </div>
              </div>
            ) : (
              <div key={c.id} className="flex justify-end">
                <div className="text-right">
                  <div className="inline-block bg-[var(--accent-group-soft-bg)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
                    {c.body}
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1">
                    {c.read_at ? "既読 · " : ""}
                    {formatTime(c.created_at)}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <form action={boundSend} className="flex gap-2 pt-2">
          <input
            name="body"
            required
            placeholder="メッセージを入力..."
            className="flex-1 h-10 border border-[var(--border-strong)] rounded-lg px-3.5 text-[13px]"
          />
          <button className="btn-group h-10 px-5 rounded-lg text-[13px] font-bold">送信</button>
        </form>
      </div>
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

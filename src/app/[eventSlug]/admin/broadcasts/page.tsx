import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listBroadcasts } from "@/lib/data/broadcasts";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import { formatDateTime } from "@/lib/format";
import { sendBroadcastAction } from "./actions";

export default async function AdminBroadcastsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ target?: string }>;
}) {
  const { eventSlug } = await params;
  const { target: targetParam } = await searchParams;
  const auth = await requireAdminSession(eventSlug);
  const target = targetParam === "unsubmitted" ? "unsubmitted" : "all";

  const [broadcasts, rows] = await Promise.all([
    listBroadcasts(auth.eventId),
    listSubmissionsForAdmin(auth.eventId),
  ]);

  const unsubmittedCount = rows.filter((r) => !r.status || r.status === "draft").length;
  const boundSend = sendBroadcastAction.bind(null, eventSlug);

  return (
    <div className="space-y-5 max-w-5xl">
      <h1 className="text-lg font-bold">連絡・お知らせ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5 items-start">
        <div className="card p-6 space-y-4">
          <div className="flex gap-5 border-b border-[var(--border)]">
            <Link
              href={`/${eventSlug}/admin/broadcasts?target=all`}
              className={`pb-2.5 text-[13px] ${
                target === "all"
                  ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
                  : "text-[var(--muted)]"
              }`}
            >
              一斉連絡
            </Link>
            <Link
              href={`/${eventSlug}/admin/broadcasts?target=unsubmitted`}
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
              <div className="h-10 border border-[var(--border-strong)] rounded-lg flex items-center px-3.5 text-[13px] bg-[var(--background)]">
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
          <div className="text-xs font-bold text-[var(--muted)] mb-3">送信履歴</div>
          <div className="border-t border-[var(--border)]">
            {broadcasts.length === 0 && (
              <p className="py-4 text-sm text-[var(--muted)]">まだ送信履歴はありません。</p>
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

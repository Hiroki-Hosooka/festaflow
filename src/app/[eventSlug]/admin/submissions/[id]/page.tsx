import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { getSubmissionDetail, sumItems } from "@/lib/data/submissions";
import { listComments, markCommentsRead } from "@/lib/data/comments";
import { StatusBadge } from "@/components/StatusBadge";
import { BudgetBar } from "@/components/BudgetBar";
import { formatTime, yen } from "@/lib/format";
import { DecisionForm } from "./DecisionForm";
import { sendAdminCommentAction } from "./actions";

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ eventSlug: string; id: string }>;
}) {
  const { eventSlug, id } = await params;
  await requireAdminSession(eventSlug);

  const detail = await getSubmissionDetail(id);
  if (!detail || !detail.group) notFound();

  const { submission, group, items, fieldValues, fields } = detail;
  const plannedTotal = sumItems(items);

  await markCommentsRead(submission.id, "admin");
  const comments = await listComments(submission.id);

  const boundSendComment = sendAdminCommentAction.bind(null, eventSlug, submission.id);

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href={`/${eventSlug}/admin`} className="text-[11.5px] text-[var(--accent-admin-text)]">
        ← 一覧に戻る
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{submission.name || "（企画名未入力）"}</h1>
          <p className="text-[11.5px] text-[var(--muted)]">{group.name}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="card p-6 space-y-4">
        <Field label="内容" value={submission.content || "—"} />
        <Field label="場所" value={submission.location || "—"} />

        {fields.map((field) => (
          <Field
            key={field.id}
            label={field.label}
            value={fieldValues.find((v) => v.field_id === field.id)?.value || "—"}
          />
        ))}

        <div>
          <div className="text-xs font-bold text-[var(--muted)] mb-1.5">購入物品</div>
          {items.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-2)]">未入力</p>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_70px_90px] px-3 py-2 text-[12px] border-b border-[var(--border)] last:border-b-0"
                >
                  <span>{item.name}</span>
                  <span>×{item.quantity}</span>
                  <span className="text-right">{yen(item.quantity * item.unit_price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <BudgetBar allocated={group.budget_allocated} planned={plannedTotal} />
      </div>

      {(submission.status === "submitted" ||
        submission.status === "approved" ||
        submission.status === "rejected" ||
        submission.status === "returned") && (
        <div className="card p-6">
          <DecisionForm
            eventSlug={eventSlug}
            submissionId={submission.id}
            defaultComment=""
          />
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="text-xs font-bold text-[var(--muted)]">個別コメント</div>
        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-[13px] text-[var(--muted)]">まだやりとりはありません。</p>
          )}
          {comments.map((c) =>
            c.sender_type === "group" ? (
              <div key={c.id} className="flex gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] flex-none flex items-center justify-center text-[11px] text-[var(--muted)]">
                  団
                </span>
                <div>
                  <div className="bg-[var(--background)] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
                    {c.body}
                  </div>
                  <div className="text-[10.5px] text-[var(--muted-2)] mt-1">
                    {group.name} · {formatTime(c.created_at)}
                  </div>
                </div>
              </div>
            ) : (
              <div key={c.id} className="flex justify-end">
                <div className="text-right">
                  <div className="inline-block bg-[oklch(95%_0.045_75)] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
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
        <form action={boundSendComment} className="flex gap-2 pt-1">
          <input
            name="body"
            required
            placeholder="メッセージを入力..."
            className="flex-1 h-10 border border-[var(--border-strong)] rounded-lg px-3.5 text-[13px]"
          />
          <button className="btn-admin h-10 px-5 rounded-lg text-[13px] font-bold">送信</button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-[var(--muted)] mb-1">{label}</div>
      <div className="text-[13px] leading-relaxed">{value}</div>
    </div>
  );
}

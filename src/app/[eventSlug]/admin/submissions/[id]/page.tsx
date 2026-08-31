import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/session";
import { getSubmissionDetail, sumItems } from "@/lib/data/submissions";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listComments, markCommentsRead } from "@/lib/data/comments";
import { listAttachments, listAttachmentCommentsByIds } from "@/lib/data/attachments";
import { StatusBadge } from "@/components/StatusBadge";
import { BudgetBar } from "@/components/BudgetBar";
import { formatDateTime, formatTime, yen } from "@/lib/format";
import { DecisionForm } from "./DecisionForm";
import { StockDecisionControl } from "./StockDecisionControl";
import { AttachmentReviewControl } from "./AttachmentReviewControl";
import { sendAdminCommentAction } from "./actions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";

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
  const purchaseItems = items.filter((i) => i.kind === "purchase");
  const borrowItems = items.filter((i) => i.kind === "borrow");
  const [inventoryUsage, attachments] = await Promise.all([
    getInventoryUsage(submission.event_id),
    listAttachments(submission.id),
  ]);
  const attachmentComments = await listAttachmentCommentsByIds(attachments.map((a) => a.id));

  const [, comments] = await Promise.all([
    markCommentsRead(submission.id, "admin"),
    listComments(submission.id),
  ]);

  const boundSendComment = sendAdminCommentAction.bind(null, eventSlug, submission.id);

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "ホーム", href: `/${eventSlug}/admin` },
          { label: "企画一覧", href: `/${eventSlug}/admin/submissions` },
          { label: group.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{submission.name || "（企画名未入力）"}</h1>
          <p className="text-[11.5px] text-[var(--muted)]">{group.name}</p>
        </div>
        <StatusBadge status={submission.status} />
      </div>

      <div className="card p-6 space-y-4">
        <Field label="内容" value={submission.content || "—"} />
        <Field label="企画ジャンル" value={submission.genre || "—"} />
        <Field label="所属区分" value={submission.affiliation || "—"} />
        <Field label="開催エリア" value={submission.area || "—"} />
        <Field label="場所" value={submission.location || "—"} />
        <Field
          label="担任・部活動顧問の確認"
          value={submission.teacher_check ? "確認済み" : "未確認"}
        />

        {fields.map((field) => (
          <Field
            key={field.id}
            label={field.label}
            value={fieldValues.find((v) => v.field_id === field.id)?.value || "—"}
          />
        ))}

        <div>
          <div className="card-heading mb-1.5">購入物品</div>
          {purchaseItems.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-2)]">未入力</p>
          ) : (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              {purchaseItems.map((item) => (
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

        {borrowItems.length > 0 && (
          <div>
            <div className="card-heading mb-1.5">借用物品</div>
            <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
              {borrowItems.map((item) => {
                const usage = item.inventory_item_id
                  ? inventoryUsage.get(item.inventory_item_id)
                  : undefined;
                return (
                  <div key={item.id} className="px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-semibold">
                        {item.name} ×{item.quantity}
                      </span>
                      {usage && (
                        <span className="text-[11px] text-[var(--muted)]">
                          在庫 {usage.totalQuantity} / この物品への要求合計 {usage.requestedTotal}
                          {usage.requestedTotal > usage.totalQuantity && (
                            <span className="text-[var(--danger-text)] font-semibold">
                              {" "}
                              ・競合あり
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <StockDecisionControl
                      eventSlug={eventSlug}
                      submissionId={submission.id}
                      submissionItemId={item.id}
                      requestedQuantity={item.quantity}
                      stockStatus={item.stock_status}
                      securedQuantity={item.secured_quantity}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <BudgetBar allocated={group.budget_allocated} planned={plannedTotal} />
      </div>

      {attachments.length > 0 && (
        <div className="card p-6 space-y-3">
          <div className="card-heading">添付資料</div>
          {attachments.map((a) => (
            <div key={a.id} className="border border-[var(--border)] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap text-[12.5px]">
                <span className="font-semibold">{a.file_name}</span>
                <span className="text-[10.5px] text-[var(--muted-2)]">
                  {formatDateTime(a.uploaded_at)}
                </span>
              </div>
              <AttachmentReviewControl
                eventSlug={eventSlug}
                submissionId={submission.id}
                attachmentId={a.id}
                reviewStatus={a.review_status}
                comments={attachmentComments.get(a.id) ?? []}
                groupName={group.name}
              />
            </div>
          ))}
        </div>
      )}

      {(submission.status === "submitted" ||
        submission.status === "approved" ||
        submission.status === "rejected" ||
        submission.status === "returned") && (
        <div className="card p-6">
          <DecisionForm
            eventSlug={eventSlug}
            submissionId={submission.id}
            defaultComment=""
            pendingBorrowNames={borrowItems
              .filter((i) => i.stock_status === "pending")
              .map((i) => i.name)}
          />
        </div>
      )}

      <div className="card p-6 space-y-4">
        <div className="card-heading">個別コメント</div>
        <div className="space-y-3">
          {comments.length === 0 && (
            <EmptyState icon="chat" title="まだやりとりはありません" />
          )}
          {comments.map((c) =>
            c.sender_type === "group" ? (
              <div key={c.id} className="flex gap-2.5">
                <span className="w-7 h-7 rounded-full bg-[var(--background)] border border-[var(--border)] flex-none flex items-center justify-center text-[11px] text-[var(--muted)]">
                  団
                </span>
                <div>
                  <div className="bg-[var(--background)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
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
                  <div className="inline-block bg-[var(--accent-admin-soft-bg)] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed max-w-sm">
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

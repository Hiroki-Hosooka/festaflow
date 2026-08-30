import Link from "next/link";
import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission, getSubmissionDetail, sumItems } from "@/lib/data/submissions";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { hasUnreadForSubmission } from "@/lib/data/comments";
import { listAttachments } from "@/lib/data/attachments";
import { daysUntil, formatDateTime, yen } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { HubTile } from "@/components/HubTile";

export default async function GroupHubPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);

  const [detail, schedules, hasUnread, attachments] = await Promise.all([
    getSubmissionDetail(submission.id),
    listSubmissionSchedules(auth.eventId),
    hasUnreadForSubmission(submission.id, "group"),
    listAttachments(submission.id),
  ]);
  if (!detail || !detail.group) {
    throw new Error("企画データの取得に失敗しました。");
  }

  const plannedTotal = sumItems(
    detail.items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price }))
  );
  const needsFixCount = attachments.filter((a) => a.review_status === "needs_fix").length;
  const upcoming = [...schedules].sort(
    (a, b) => daysUntil(a.deadline) - daysUntil(b.deadline)
  )[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">{auth.groupName} のホーム</h1>
        <StatusBadge status={detail.submission.status} />
      </div>

      <div className="card px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap text-[13px]">
        <span>
          使用予定 {yen(plannedTotal)} / 配分予算 {yen(detail.group.budget_allocated)}
        </span>
        <Link
          href={`/${eventSlug}/group/submission`}
          className="text-[var(--accent-group-text)] font-semibold text-[12px] whitespace-nowrap"
        >
          企画を確認・編集する →
        </Link>
      </div>

      {upcoming && (
        <div className="card px-4 py-3.5 text-[13px]">
          <span>
            {upcoming.title}の締切: <strong>{formatDateTime(upcoming.deadline)}</strong>
          </span>
          <span className="ml-2 text-[var(--muted)]">
            {daysUntil(upcoming.deadline) < 0
              ? "締切を過ぎています"
              : daysUntil(upcoming.deadline) === 0
              ? "本日締切"
              : `あと${daysUntil(upcoming.deadline)}日`}
          </span>
        </div>
      )}

      {needsFixCount > 0 && (
        <p className="text-[12.5px] text-[var(--danger-text)]">
          添付資料に要修正のものが{needsFixCount}件あります。{" "}
          <Link href={`/${eventSlug}/group/submission`} className="underline font-semibold">
            確認する
          </Link>
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HubTile
          accent="group"
          href={`/${eventSlug}/group/submission`}
          icon="clipboard"
          label="企画の提出"
          description="企画内容・物品・分類を入力します"
        />
        <HubTile
          accent="group"
          href={`/${eventSlug}/group/messages`}
          icon="chat"
          label="連絡・コメント"
          description="実行委員会とのやり取りを確認します"
          badgeCount={hasUnread ? 1 : 0}
          badgeTone="danger"
        />
        <HubTile
          accent="group"
          href={`/${eventSlug}/group/shifts`}
          icon="calendar"
          label="当番シフト"
          description="当番の希望提出・自動配置を行います"
        />
        <HubTile
          accent="group"
          href={`/${eventSlug}/group/todos`}
          icon="checkSquare"
          label="ToDoリスト"
          description="準備タスクを班ごとに管理します"
        />
        <HubTile
          accent="group"
          href={`/${eventSlug}/group/documents`}
          icon="document"
          label="配布資料"
          description="実行委員会からの配布資料を確認します"
        />
      </div>
    </div>
  );
}

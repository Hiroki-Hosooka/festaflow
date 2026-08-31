import Link from "next/link";
import { requireGroupSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getOrCreateSubmission, getSubmissionDetail, sumItems } from "@/lib/data/submissions";
import { listSubmissionSchedulesForGroup } from "@/lib/data/submissionSchedules";
import { listGroupCalendarEvents } from "@/lib/data/calendarEvents";
import { hasUnreadForSubmission } from "@/lib/data/comments";
import { listBroadcastsForGroup } from "@/lib/data/broadcasts";
import { listAttachments } from "@/lib/data/attachments";
import { daysUntil, formatRelativeTime, yen } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { HubTile } from "@/components/HubTile";
import { Icon } from "@/components/Icons";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { MonthCalendar, type CalendarDeadlineItem } from "@/components/MonthCalendar";
import { subscribeGroupPushAction, unsubscribeGroupPushAction } from "./settings/actions";
import { createGroupCalendarEventAction, deleteGroupCalendarEventAction } from "./calendarActions";

export default async function GroupHubPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const isUnsubmitted = submission.status === "draft";

  const [event, detail, schedules, calendarEvents, hasUnread, attachments, broadcasts] =
    await Promise.all([
      getEventBySlug(eventSlug),
      getSubmissionDetail(submission.id),
      listSubmissionSchedulesForGroup(auth.eventId, auth.groupId),
      listGroupCalendarEvents(auth.eventId, auth.groupId),
      hasUnreadForSubmission(submission.id, "group"),
      listAttachments(submission.id),
      listBroadcastsForGroup(auth.eventId, auth.groupId, isUnsubmitted),
    ]);
  if (!detail || !detail.group) {
    throw new Error("企画データの取得に失敗しました。");
  }
  const adminLabel = event?.admin_label ?? "実行委員会";

  const plannedTotal = sumItems(
    detail.items.map((i) => ({ quantity: i.quantity, unit_price: i.unit_price }))
  );
  const needsFixCount = attachments.filter((a) => a.review_status === "needs_fix").length;
  const latestBroadcast = broadcasts[0];

  const deadlineItems: CalendarDeadlineItem[] = schedules.map((s) => {
    const remaining = daysUntil(s.deadline);
    return {
      id: s.id,
      title: s.title,
      date: s.deadline,
      hint: s.hint,
      daysLeftLabel: remaining < 0 ? "超過" : remaining === 0 ? "本日" : `あと${remaining}日`,
      overdue: remaining < 0,
      dueToday: remaining === 0,
    };
  });
  const personalItems = calendarEvents.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.event_date,
    color: e.color,
  }));

  const boundAddEvent = createGroupCalendarEventAction.bind(null, eventSlug);
  const boundDeleteEvent = deleteGroupCalendarEventAction.bind(null, eventSlug);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h1 className="page-title">{auth.groupName} のホーム</h1>
        <StatusBadge status={detail.submission.status} />
      </div>

      <div className="card p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="card-heading inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-flex w-4 h-4 text-[var(--accent-group-text)]">
              <Icon name="megaphone" />
            </span>
            {adminLabel}からのお知らせ
          </div>
          <Link
            href={`/${eventSlug}/group/messages?tab=broadcast`}
            className="text-[12px] font-semibold text-[var(--accent-group-text)] whitespace-nowrap"
          >
            もっと見る →
          </Link>
        </div>

        {latestBroadcast ? (
          <Link
            href={`/${eventSlug}/group/messages?tab=broadcast`}
            className="block rounded-xl bg-[var(--accent-group-soft-bg)] px-4 py-3.5 hover:opacity-90"
          >
            <p className="text-[14px] leading-relaxed font-medium text-[var(--foreground)]">
              {latestBroadcast.body}
            </p>
            <p className="text-[11px] text-[var(--muted)] mt-1.5">
              {formatRelativeTime(latestBroadcast.created_at)}
            </p>
          </Link>
        ) : (
          <p className="text-[12.5px] text-[var(--muted-2)] inline-flex items-center gap-1.5">
            <Icon name="megaphone" className="w-3.5 h-3.5 text-[var(--muted-2)]" />
            まだお知らせはありません
          </p>
        )}

        {auth.role === "leader" && (
          <Link
            href={`/${eventSlug}/group/messages?tab=comments`}
            className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background)]"
          >
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
              <Icon name="chat" className="w-3.5 h-3.5 text-[var(--muted)]" />
              {adminLabel}への個別の連絡
              {hasUnread && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--accent-group-text)]"
                  aria-label="未読"
                />
              )}
            </span>
            <span className="text-[11.5px] text-[var(--muted-2)]">確認する →</span>
          </Link>
        )}
      </div>

      <div className="card px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap text-[13px]">
        <span>
          使用予定{" "}
          <strong className="text-[15px] text-[var(--foreground)]">{yen(plannedTotal)}</strong>
          {" / 配分予算 "}
          {yen(detail.group.budget_allocated)}
        </span>
        <Link
          href={`/${eventSlug}/group/submission`}
          className="text-[var(--accent-group-text)] font-semibold text-[12px] whitespace-nowrap"
        >
          企画を確認・編集する →
        </Link>
      </div>

      {needsFixCount > 0 && (
        <p className="text-[12.5px] text-[var(--danger-text)] font-medium">
          添付資料に要修正のものが{needsFixCount}件あります。{" "}
          <Link href={`/${eventSlug}/group/submission`} className="underline font-semibold">
            確認する
          </Link>
        </p>
      )}

      <div className="card px-4 py-3.5 space-y-2">
        <div className="text-[13px] font-bold">通知</div>
        <PushNotificationToggle
          subscribeAction={subscribeGroupPushAction.bind(null, eventSlug)}
          unsubscribeAction={unsubscribeGroupPushAction.bind(null, eventSlug)}
          activeButtonClassName="btn-group"
        />
      </div>

      <div>
        <div className="section-caption mb-2">各機能へ</div>
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
            description={`${adminLabel}とのやり取りを確認します`}
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
            description={`${adminLabel}からの配布資料を確認します`}
          />
          {auth.role === "leader" && (
            <HubTile
              accent="group"
              href={`/${eventSlug}/group/settings`}
              icon="settings"
              label="設定"
              description="ログイン合言葉の変更などを行います"
            />
          )}
        </div>
      </div>

      <MonthCalendar
        accent="group"
        deadlines={deadlineItems}
        personalEvents={personalItems}
        addEventAction={auth.role === "leader" ? boundAddEvent : undefined}
        deleteEventAction={auth.role === "leader" ? boundDeleteEvent : undefined}
      />
    </div>
  );
}

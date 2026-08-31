import { listEvents } from "@/lib/data/events";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import {
  listAdminPushSubscriptions,
  listPushSubscriptionsForGroups,
} from "@/lib/data/pushSubscriptions";
import { hasReminderBeenSent, markReminderSent } from "@/lib/data/scheduleReminders";
import { sendPushToSubscriptions } from "@/lib/push";
import { daysUntil } from "@/lib/format";

// 締切の何日前に通知するか（当日=0を含む）
const THRESHOLDS = [3, 1, 0];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const events = await listEvents();
  let sentCount = 0;

  for (const event of events) {
    const schedules = await listSubmissionSchedules(event.id);
    if (schedules.length === 0) continue;

    for (const schedule of schedules) {
      const remaining = daysUntil(schedule.deadline);
      if (!THRESHOLDS.includes(remaining)) continue;

      const threshold = String(remaining);
      const already = await hasReminderBeenSent(schedule.id, threshold);
      if (already) continue;

      const dayLabel = remaining === 0 ? "本日締切です" : `締切まであと${remaining}日です`;
      const body = `${schedule.title}: ${dayLabel}`;

      try {
        const rows = await listSubmissionsForAdmin(event.id);
        const unsubmittedGroupIds = rows
          .filter((r) => !r.status || r.status === "draft")
          .filter((r) => !schedule.target_group_ids || schedule.target_group_ids.includes(r.groupId))
          .map((r) => r.groupId);

        const [adminSubs, groupSubs] = await Promise.all([
          listAdminPushSubscriptions(event.id),
          listPushSubscriptionsForGroups(event.id, unsubmittedGroupIds),
        ]);

        await Promise.all([
          sendPushToSubscriptions(adminSubs, {
            title: "締切のお知らせ",
            body: `${body}（未提出 ${unsubmittedGroupIds.length}団体）`,
            url: `/${event.slug}/admin/submissions`,
          }),
          sendPushToSubscriptions(groupSubs, {
            title: "締切のお知らせ",
            body,
            url: `/${event.slug}/group/submission`,
          }),
        ]);
        sentCount += adminSubs.length + groupSubs.length;
      } finally {
        // 送信自体が一部失敗しても、同じ締切×しきい値で何度も再送しないよう必ず記録する
        await markReminderSent(schedule.id, threshold);
      }
    }
  }

  return Response.json({ ok: true, sentCount });
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createBroadcast } from "@/lib/data/broadcasts";
import { listSubmissionsForAdmin } from "@/lib/data/submissions";
import {
  listAllGroupPushSubscriptions,
  listPushSubscriptionsForGroups,
} from "@/lib/data/pushSubscriptions";
import { sendPushToSubscriptions } from "@/lib/push";
import { getEventBySlug } from "@/lib/data/events";
import type { BroadcastTarget } from "@/lib/database.types";

export async function sendBroadcastAction(eventSlug: string, formData: FormData) {
  const auth = await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  const targetTypeRaw = String(formData.get("target_type") ?? "all") as BroadcastTarget;
  const targetType: BroadcastTarget =
    targetTypeRaw === "unsubmitted" || targetTypeRaw === "custom" ? targetTypeRaw : "all";
  if (!body) return;

  const groupIds =
    targetType === "custom" ? formData.getAll("group_ids").map(String).filter(Boolean) : null;
  if (targetType === "custom" && (!groupIds || groupIds.length === 0)) return;

  await createBroadcast(auth.eventId, targetType, body, groupIds);
  revalidatePath(`/${eventSlug}/admin/messages`);

  try {
    const event = await getEventBySlug(eventSlug);
    let subscriptions;
    if (targetType === "custom" && groupIds) {
      subscriptions = await listPushSubscriptionsForGroups(auth.eventId, groupIds);
    } else if (targetType === "unsubmitted") {
      const rows = await listSubmissionsForAdmin(auth.eventId);
      const unsubmittedGroupIds = rows
        .filter((r) => !r.status || r.status === "draft")
        .map((r) => r.groupId);
      subscriptions = await listPushSubscriptionsForGroups(auth.eventId, unsubmittedGroupIds);
    } else {
      subscriptions = await listAllGroupPushSubscriptions(auth.eventId);
    }
    await sendPushToSubscriptions(subscriptions, {
      title: `${event?.admin_label ?? "実行委員会"}からのお知らせ`,
      body,
      url: `/${eventSlug}/group/messages?tab=broadcast`,
    });
  } catch {
    // 通知の送信失敗は連絡の送信自体を失敗させない
  }
}

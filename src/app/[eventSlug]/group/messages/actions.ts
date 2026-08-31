"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { addComment } from "@/lib/data/comments";
import { listAdminPushSubscriptions } from "@/lib/data/pushSubscriptions";
import { sendPushToSubscriptions } from "@/lib/push";

export async function sendGroupCommentAction(eventSlug: string, formData: FormData) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") return;
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await addComment(submission.id, "group", body);
  revalidatePath(`/${eventSlug}/group/messages`);

  try {
    const subscriptions = await listAdminPushSubscriptions(auth.eventId);
    await sendPushToSubscriptions(subscriptions, {
      title: `${auth.groupName}から新着コメント`,
      body,
      url: `/${eventSlug}/admin/submissions/${submission.id}`,
    });
  } catch {
    // 通知の送信失敗はコメント送信自体を失敗させない
  }
}

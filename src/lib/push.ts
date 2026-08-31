import "server-only";
import webpush from "web-push";
import { deletePushSubscriptionsByEndpoints } from "@/lib/data/pushSubscriptions";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error(
      "VAPID_SUBJECT / NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY が設定されていません。"
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// 通知は「届けば嬉しいおまけ」であり、送信の成否が主機能（連絡の保存・締切管理など）を
// 巻き込んで失敗してはならないため、呼び出し側で必ずtry/catchするか、この関数内で
// 個別の失敗を握りつぶす。期限切れの購読(404/410)はここでDBから削除する。
export async function sendPushToSubscriptions(
  subscriptions: PushTarget[],
  payload: PushPayload
): Promise<void> {
  if (subscriptions.length === 0) return;
  if (!process.env.VAPID_PRIVATE_KEY) return;
  ensureConfigured();

  const expired: string[] = [];
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          expired.push(sub.endpoint);
        }
      }
    })
  );

  if (expired.length > 0) {
    await deletePushSubscriptionsByEndpoints(expired);
  }
}

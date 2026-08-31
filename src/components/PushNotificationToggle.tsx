"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function PushNotificationToggle({
  subscribeAction,
  unsubscribeAction,
  activeButtonClassName = "btn-group",
}: {
  subscribeAction: (sub: { endpoint: string; p256dh: string; auth: string }) => Promise<void>;
  unsubscribeAction: (endpoint: string) => Promise<void>;
  activeButtonClassName?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      // useEffectはクライアントでのみ実行されるためwindow/navigatorは必ず存在するが、
      // 対応判定用のsetStateを常に非同期の先（awaitの後）で呼ぶことでレンダー中の
      // setState呼び出しを避ける
      await Promise.resolve();
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSupported(false);
        setChecked(true);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  async function handleSubscribe() {
    setPending(true);
    setError("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("通知の設定に失敗しました（サーバー側の設定が未完了です）。");
        setPending(false);
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("通知が許可されませんでした。ブラウザの設定から通知を許可してください。");
        setPending(false);
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("subscription incomplete");
      }
      await subscribeAction({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        auth: json.keys.auth,
      });
      setSubscribed(true);
    } catch {
      setError("通知の設定に失敗しました。");
    }
    setPending(false);
  }

  async function handleUnsubscribe() {
    setPending(true);
    setError("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await unsubscribeAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("解除に失敗しました。");
    }
    setPending(false);
  }

  if (!checked) return null;

  if (!supported) {
    return (
      <p className="text-[12.5px] text-[var(--muted)]">
        この端末・ブラウザは通知に対応していません。iPhoneの場合はSafariでホーム画面に追加してから開くと利用できます。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[12.5px] text-[var(--muted)]">
        {subscribed
          ? "この端末で通知が有効になっています。"
          : "この端末で連絡・締切のお知らせを通知で受け取れます。"}
      </p>
      <button
        type="button"
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
        disabled={pending}
        className={`h-9 px-4 rounded-md text-[12.5px] font-semibold disabled:opacity-60 ${
          subscribed ? "border border-[var(--border-strong)]" : activeButtonClassName
        }`}
      >
        {pending ? "処理中..." : subscribed ? "通知をオフにする" : "通知をオンにする"}
      </button>
      {error && <p className="text-[12.5px] text-[var(--danger-text)]">{error}</p>}
    </div>
  );
}

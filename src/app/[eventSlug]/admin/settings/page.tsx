import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { EventSettingsForm } from "./EventSettingsForm";
import { subscribeAdminPushAction, unsubscribeAdminPushAction } from "./actions";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  await requireAdminSession(eventSlug);
  const event = await getEventBySlug(eventSlug);

  return (
    <div className="space-y-5 max-w-xl">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "設定" }]} />
      <h1 className="page-title">設定</h1>

      <div className="card p-6 space-y-3">
        <div className="card-heading">基本設定</div>
        {event && (
          <EventSettingsForm
            eventSlug={eventSlug}
            name={event.name}
            adminLabel={event.admin_label}
          />
        )}
      </div>

      <div className="card p-6 space-y-3">
        <div className="card-heading">通知</div>
        <p className="text-[12.5px] text-[var(--muted)]">
          団体からの個別コメント・締切のリマインドをこの端末に通知します。
        </p>
        <PushNotificationToggle
          subscribeAction={subscribeAdminPushAction.bind(null, eventSlug)}
          unsubscribeAction={unsubscribeAdminPushAction.bind(null, eventSlug)}
          activeButtonClassName="btn-admin"
        />
      </div>
    </div>
  );
}

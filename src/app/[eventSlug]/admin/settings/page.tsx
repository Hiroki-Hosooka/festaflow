import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { HubTile } from "@/components/HubTile";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EventSettingsForm } from "./EventSettingsForm";

export default async function AdminSettingsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  await requireAdminSession(eventSlug);
  const event = await getEventBySlug(eventSlug);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "設定" }]} />
      <div>
        <h1 className="page-title">設定</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1">
          団体・予算配分、企画の提出項目、分類の選択肢、配布資料をここから管理できます。
        </p>
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/groups`}
          icon="users"
          label="団体・予算"
          description="団体の追加、予算配分、合言葉の再設定"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/fields`}
          icon="receipt"
          label="提出項目"
          description="企画フォームの追加項目の増減・名称変更"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/classifications`}
          icon="tag"
          label="分類設定"
          description="所属区分・開催エリアの選択肢を編集します"
        />
        <HubTile
          accent="admin"
          href={`/${eventSlug}/admin/documents`}
          icon="document"
          label="配布資料"
          description="全団体への配布資料をアップロードします"
        />
      </div>
    </div>
  );
}

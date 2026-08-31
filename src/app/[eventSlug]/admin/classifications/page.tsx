import { requireAdminSession } from "@/lib/session";
import { listAllClassificationOptions } from "@/lib/data/classificationOptions";
import { OptionColumn } from "./OptionColumn";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function AdminClassificationsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const { affiliation, area } = await listAllClassificationOptions(auth.eventId);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "分類設定" }]} />
      <div>
        <h1 className="page-title">分類設定</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
          企画一覧の絞り込みや企画フォームで使う「所属区分」「開催エリア」の選択肢を、学校の実情に合わせて自由に追加・変更・削除できます。削除・変更した選択肢が既に使われている企画では、その時点の表示名がそのまま残ります。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <OptionColumn eventSlug={eventSlug} category="affiliation" title="所属区分" options={affiliation} />
        <OptionColumn eventSlug={eventSlug} category="area" title="開催エリア" options={area} />
      </div>
    </div>
  );
}

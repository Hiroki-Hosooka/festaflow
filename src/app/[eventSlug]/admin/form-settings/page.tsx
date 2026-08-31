import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listFormFields } from "@/lib/data/formFields";
import { listAllClassificationOptions } from "@/lib/data/classificationOptions";
import { NewFieldForm } from "../fields/NewFieldForm";
import { DeleteFieldButton } from "../fields/DeleteFieldButton";
import { EditFieldForm } from "../fields/EditFieldForm";
import { FieldsPreview } from "../fields/FieldsPreview";
import { OptionColumn } from "../classifications/OptionColumn";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";

const TYPE_LABELS: Record<string, string> = {
  text: "一行テキスト",
  textarea: "複数行テキスト",
  number: "数値",
};

export default async function AdminFormSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { eventSlug } = await params;
  const { tab: tabParam } = await searchParams;
  const auth = await requireAdminSession(eventSlug);
  const tab = tabParam === "classifications" ? "classifications" : "fields";

  const [fields, classificationOptions] = await Promise.all([
    listFormFields(auth.eventId),
    listAllClassificationOptions(auth.eventId),
  ]);
  const genreOptions = classificationOptions.genre.map((o) => o.value);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "フォーム設定" }]} />
      <div>
        <h1 className="page-title">フォーム設定</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
          企画提出フォームの追加項目と、所属区分・開催エリア・企画ジャンルの選択肢をここでまとめて管理します。
        </p>
      </div>

      <div className="flex gap-5 border-b border-[var(--border)]">
        <Link
          href={`/${eventSlug}/admin/form-settings`}
          className={`pb-2.5 text-[13px] ${
            tab === "fields"
              ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
              : "text-[var(--muted)]"
          }`}
        >
          提出項目
        </Link>
        <Link
          href={`/${eventSlug}/admin/form-settings?tab=classifications`}
          className={`pb-2.5 text-[13px] ${
            tab === "classifications"
              ? "font-bold border-b-2 border-[var(--accent-admin-text)]"
              : "text-[var(--muted)]"
          }`}
        >
          分類設定
        </Link>
      </div>

      {tab === "fields" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="space-y-5">
            <div className="card p-6 space-y-3">
              <div className="card-heading">項目を追加</div>
              <p className="text-[12px] text-[var(--muted)]">
                企画名・内容・購入物品・場所は初期項目として常に表示されます。ここで追加した項目は、既存の提出物では「未入力」のまま残ります。
              </p>
              <NewFieldForm eventSlug={eventSlug} genreOptions={genreOptions} />
            </div>

            <div className="card overflow-hidden">
              {fields.length === 0 && <EmptyState icon="receipt" title="追加項目はまだありません" />}
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="px-4 py-3 border-b border-[var(--border)] last:border-b-0 text-[13px] space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold">{field.label}</span>
                      <span className="text-[11px] text-[var(--muted-2)]">
                        {TYPE_LABELS[field.field_type] ?? field.field_type}
                      </span>
                      {field.required && (
                        <span className="text-[11px] text-[var(--danger-text)]">必須</span>
                      )}
                      {field.applicable_genres && field.applicable_genres.length > 0 && (
                        <span className="text-[11px] text-[var(--muted-2)]">
                          対象: {field.applicable_genres.join("・")}
                        </span>
                      )}
                    </div>
                    <DeleteFieldButton eventSlug={eventSlug} fieldId={field.id} />
                  </div>
                  <details>
                    <summary className="cursor-pointer text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
                      名前・必須・対象ジャンルを編集
                    </summary>
                    <div className="mt-2">
                      <EditFieldForm eventSlug={eventSlug} field={field} genreOptions={genreOptions} />
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <FieldsPreview
            fields={fields}
            affiliationOptions={classificationOptions.affiliation.map((o) => o.value)}
            areaOptions={classificationOptions.area.map((o) => o.value)}
          />
        </div>
      ) : (
        <>
          <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
            企画一覧の絞り込みや企画フォームで使う選択肢を、学校の実情に合わせて自由に追加・変更・削除できます。削除・変更した選択肢が既に使われている企画では、その時点の表示名がそのまま残ります。企画ジャンルは「提出項目」タブでの出し分けにも使えます。
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            <OptionColumn
              eventSlug={eventSlug}
              category="affiliation"
              title="所属区分"
              options={classificationOptions.affiliation}
            />
            <OptionColumn
              eventSlug={eventSlug}
              category="area"
              title="開催エリア"
              options={classificationOptions.area}
            />
            <OptionColumn
              eventSlug={eventSlug}
              category="genre"
              title="企画ジャンル"
              options={classificationOptions.genre}
            />
          </div>
        </>
      )}
    </div>
  );
}

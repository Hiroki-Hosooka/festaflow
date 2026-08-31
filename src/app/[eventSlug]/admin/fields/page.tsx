import { requireAdminSession } from "@/lib/session";
import { listFormFields } from "@/lib/data/formFields";
import { listAllClassificationOptions } from "@/lib/data/classificationOptions";
import { NewFieldForm } from "./NewFieldForm";
import { DeleteFieldButton } from "./DeleteFieldButton";
import { EditFieldForm } from "./EditFieldForm";
import { FieldsPreview } from "./FieldsPreview";

const TYPE_LABELS: Record<string, string> = {
  text: "一行テキスト",
  textarea: "複数行テキスト",
  number: "数値",
};

export default async function AdminFieldsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const [fields, classificationOptions] = await Promise.all([
    listFormFields(auth.eventId),
    listAllClassificationOptions(auth.eventId),
  ]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-lg font-bold">提出項目</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
          企画名・内容・購入物品・場所は初期項目として常に表示されます。ここで追加した項目は、既存の提出物では「未入力」のまま残り、これ以降の新規提出・編集から反映されます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="space-y-5">
          <div className="card p-6 space-y-3">
            <div className="text-xs font-bold text-[var(--muted)]">項目を追加</div>
            <NewFieldForm eventSlug={eventSlug} />
          </div>

          <div className="card overflow-hidden">
            {fields.length === 0 && (
              <p className="px-4 py-6 text-sm text-[var(--muted)]">
                追加項目はまだありません。
              </p>
            )}
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
                  </div>
                  <DeleteFieldButton eventSlug={eventSlug} fieldId={field.id} />
                </div>
                <details>
                  <summary className="cursor-pointer text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
                    名前・必須を編集
                  </summary>
                  <div className="mt-2">
                    <EditFieldForm eventSlug={eventSlug} field={field} />
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
    </div>
  );
}

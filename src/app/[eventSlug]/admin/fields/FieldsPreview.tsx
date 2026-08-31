import type { Database } from "@/lib/database.types";

type FormFieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

const TYPE_PLACEHOLDER: Record<string, string> = {
  text: "（回答例）",
  textarea: "（回答例）",
  number: "0",
};

function PreviewField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5">
        {label}
        {required && <span className="text-[var(--danger-text)]"> *</span>}
      </label>
      {children}
    </div>
  );
}

const disabledInputClass =
  "w-full h-10 border border-[var(--border)] rounded-lg px-3.5 text-[13px] bg-[var(--background)] text-[var(--muted)]";

export function FieldsPreview({
  fields,
  affiliationOptions,
  areaOptions,
}: {
  fields: FormFieldRow[];
  affiliationOptions: string[];
  areaOptions: string[];
}) {
  return (
    <div className="card p-6 space-y-4 sm:sticky sm:top-20">
      <div>
        <div className="text-xs font-bold text-[var(--muted)]">プレビュー</div>
        <p className="text-[11.5px] text-[var(--muted-2)] mt-0.5">
          団体側に表示される企画提出フォームの見た目です（保存後に反映されます）。
        </p>
      </div>

      <div className="space-y-4 opacity-90 pointer-events-none select-none" aria-hidden="true">
        <PreviewField label="企画名" required>
          <input disabled placeholder="（回答例）" className={disabledInputClass} />
        </PreviewField>
        <PreviewField label="内容">
          <textarea disabled placeholder="（回答例）" rows={2} className={disabledInputClass} />
        </PreviewField>
        <div className="grid grid-cols-2 gap-3">
          <PreviewField label="所属区分">
            <select disabled className={disabledInputClass}>
              <option>{affiliationOptions[0] ?? "（未設定）"}</option>
            </select>
          </PreviewField>
          <PreviewField label="開催エリア">
            <select disabled className={disabledInputClass}>
              <option>{areaOptions[0] ?? "（未設定）"}</option>
            </select>
          </PreviewField>
        </div>
        <PreviewField label="場所">
          <input disabled placeholder="（回答例）" className={disabledInputClass} />
        </PreviewField>
        <PreviewField label="物品（購入／借用）">
          <div className={`${disabledInputClass} flex items-center h-10`}>
            購入・借用の物品一覧（固定項目）
          </div>
        </PreviewField>

        {fields.map((field) => (
          <PreviewField key={field.id} label={field.label} required={field.required}>
            {field.field_type === "textarea" ? (
              <textarea
                disabled
                placeholder={TYPE_PLACEHOLDER[field.field_type]}
                rows={2}
                className={disabledInputClass}
              />
            ) : (
              <input
                disabled
                placeholder={TYPE_PLACEHOLDER[field.field_type] ?? "（回答例）"}
                className={disabledInputClass}
              />
            )}
          </PreviewField>
        ))}
      </div>
    </div>
  );
}

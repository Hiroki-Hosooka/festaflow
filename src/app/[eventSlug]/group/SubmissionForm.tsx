"use client";

import { useActionState, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { BudgetBar } from "@/components/BudgetBar";
import { saveSubmissionAction, type SubmitFormState } from "./actions";
import { yen } from "@/lib/format";
import type { Database } from "@/lib/database.types";

type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type ItemRow = Database["public"]["Tables"]["submission_items"]["Row"];
type FieldValueRow = Database["public"]["Tables"]["submission_field_values"]["Row"];
type FormFieldRow = Database["public"]["Tables"]["form_fields"]["Row"];

interface EditableItem {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

const initialState: SubmitFormState = {};

export function SubmissionForm({
  eventSlug,
  groupName,
  submission,
  items,
  fieldValues,
  fields,
  budgetAllocated,
}: {
  eventSlug: string;
  groupName: string;
  submission: SubmissionRow;
  items: ItemRow[];
  fieldValues: FieldValueRow[];
  fields: FormFieldRow[];
  budgetAllocated: number;
}) {
  const boundAction = saveSubmissionAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const editable = submission.status === "draft" || submission.status === "returned";

  const [name, setName] = useState(submission.name);
  const [content, setContent] = useState(submission.content);
  const [location, setLocation] = useState(submission.location);
  const [itemRows, setItemRows] = useState<EditableItem[]>(
    items.length > 0
      ? items.map((i) => ({
          key: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
        }))
      : [{ key: "new-0", name: "", quantity: 1, unitPrice: 0 }]
  );
  const [dynamicValues, setDynamicValues] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const field of fields) {
      out[field.id] = fieldValues.find((v) => v.field_id === field.id)?.value ?? "";
    }
    return out;
  });

  const plannedTotal = useMemo(
    () => itemRows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0),
    [itemRows]
  );

  function updateItem(key: string, patch: Partial<EditableItem>) {
    setItemRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addItem() {
    setItemRows((rows) => [
      ...rows,
      { key: `new-${Date.now()}-${rows.length}`, name: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(key: string) {
    setItemRows((rows) => rows.filter((r) => r.key !== key));
  }

  const itemsJson = JSON.stringify(
    itemRows
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({ name: r.name.trim(), quantity: r.quantity, unitPrice: r.unitPrice }))
  );
  const fieldValuesJson = JSON.stringify(dynamicValues);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">{groupName} の企画</h1>
        <StatusBadge status={submission.status} />
      </div>

      {submission.status === "returned" && submission.admin_comment && (
        <div className="rounded-2xl border border-[var(--warn-border)] bg-[var(--status-returned-bg)]/40 px-4 py-3 text-[13px] text-[var(--warn-text)]">
          <strong>差し戻し：</strong>
          {submission.admin_comment}
        </div>
      )}
      {submission.status === "rejected" && (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--status-rejected-bg)]/40 px-4 py-3 text-[13px] text-[var(--danger-text)]">
          <strong>却下：</strong>
          {submission.admin_comment || "この企画は却下されました。"}
        </div>
      )}
      {submission.status === "submitted" && (
        <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[13px] text-[var(--muted)]">
          実行委員会の確認をお待ちください。
        </div>
      )}
      {submission.status === "approved" && (
        <div className="rounded-2xl border border-[oklch(80%_0.1_150)] bg-[var(--status-approved-bg)]/40 px-4 py-3 text-[13px] text-[var(--status-approved-text)]">
          承認されました。内容の変更が必要な場合は個別コメントで実行委員会にご連絡ください。
        </div>
      )}

      <BudgetBar allocated={budgetAllocated} planned={plannedTotal} />

      <form action={formAction} className="card p-6 sm:p-7 space-y-5">
        <input type="hidden" name="items_json" value={itemsJson} />
        <input type="hidden" name="field_values_json" value={fieldValuesJson} />

        <div>
          <label className="block text-xs font-semibold mb-1.5">
            企画名<span className="text-[var(--danger-text)]"> *</span>
          </label>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!editable}
            required
            className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5">内容</label>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!editable}
            rows={3}
            className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm leading-relaxed disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">購入物品</label>
          <p className="text-[11px] text-[var(--muted)] mb-2">
            「単価」は1個あたりの金額です。小計は自動で計算されます。
          </p>
          <div className="border border-[var(--border-strong)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_52px_76px_76px_24px] gap-2 px-3 py-2 text-[11px] font-semibold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
              <span>品目</span>
              <span>数量</span>
              <span>単価</span>
              <span className="text-right">小計</span>
              <span />
            </div>
            {itemRows.length === 0 && (
              <p className="px-3 py-3 text-[12.5px] text-[var(--muted)]">
                購入物品はありません。
              </p>
            )}
            {itemRows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-[1fr_52px_76px_76px_24px] gap-2 px-3 py-2 border-b border-[var(--border)] last:border-b-0 items-center"
              >
                <input
                  value={row.name}
                  onChange={(e) => updateItem(row.key, { name: e.target.value })}
                  disabled={!editable}
                  placeholder="品目名"
                  className="h-8 border border-[var(--border)] rounded-md px-2 text-[13px] disabled:bg-transparent disabled:border-transparent"
                />
                <input
                  type="number"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => updateItem(row.key, { quantity: Number(e.target.value) })}
                  disabled={!editable}
                  aria-label="数量"
                  className="h-8 border border-[var(--border)] rounded-md px-2 text-[13px] disabled:bg-transparent disabled:border-transparent"
                />
                <input
                  type="number"
                  min={0}
                  value={row.unitPrice}
                  onChange={(e) => updateItem(row.key, { unitPrice: Number(e.target.value) })}
                  disabled={!editable}
                  aria-label="単価（1個あたりの金額）"
                  className="h-8 border border-[var(--border)] rounded-md px-2 text-[13px] disabled:bg-transparent disabled:border-transparent"
                />
                <span className="text-right text-[12.5px] text-[var(--muted)] tabular-nums">
                  {yen(row.quantity * row.unitPrice)}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => removeItem(row.key)}
                    className="text-[var(--muted-2)] text-sm"
                    aria-label={`${row.name || "この品目"}を削除`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          {editable && (
            <button
              type="button"
              onClick={addItem}
              className="mt-2 text-xs font-semibold text-[var(--accent-group-text)]"
            >
              ＋ 物品を追加
            </button>
          )}
        </div>

        {fields.map((field) => (
          <div key={field.id}>
            <label className="block text-xs font-semibold mb-1.5">
              {field.label}
              {field.required && <span className="text-[var(--danger-text)]"> *</span>}
            </label>
            {field.field_type === "textarea" ? (
              <textarea
                value={dynamicValues[field.id] ?? ""}
                onChange={(e) =>
                  setDynamicValues((v) => ({ ...v, [field.id]: e.target.value }))
                }
                disabled={!editable}
                rows={2}
                className="w-full border border-[var(--border-strong)] rounded-lg px-3 py-2 text-sm disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
              />
            ) : (
              <input
                type={field.field_type === "number" ? "number" : "text"}
                value={dynamicValues[field.id] ?? ""}
                onChange={(e) =>
                  setDynamicValues((v) => ({ ...v, [field.id]: e.target.value }))
                }
                disabled={!editable}
                className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
              />
            )}
          </div>
        ))}

        <div>
          <label className="block text-xs font-semibold mb-1.5">場所</label>
          <input
            name="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={!editable}
            className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
          />
        </div>

        {state.error && (
          <p className="text-[13px] text-[var(--danger-text)] font-medium">{state.error}</p>
        )}
        {state.success && !state.error && (
          <p className="text-[13px] text-[var(--status-approved-text)] font-medium">
            {state.success}
          </p>
        )}

        {editable && (
          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              name="intent"
              value="draft"
              disabled={pending}
              className="flex-1 h-11 rounded-lg border border-[var(--border-strong)] text-sm font-semibold disabled:opacity-60"
            >
              下書き保存
            </button>
            <button
              type="submit"
              name="intent"
              value="submit"
              disabled={pending}
              className="flex-1 h-11 rounded-lg btn-group text-sm font-bold disabled:opacity-60"
            >
              {submission.status === "returned" ? "再提出する" : "提出する"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

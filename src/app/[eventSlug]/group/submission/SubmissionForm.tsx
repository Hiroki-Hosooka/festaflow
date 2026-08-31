"use client";

import { useActionState, useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { BudgetBar } from "@/components/BudgetBar";
import { saveSubmissionAction, type SubmitFormState } from "./actions";
import { yen, daysUntil, formatRelativeTime, formatDateTime } from "@/lib/format";
import type { Affiliation, Area, Database, ItemKind, StockStatus } from "@/lib/database.types";

function withCurrentValue(options: string[], current: string): string[] {
  if (!current || options.includes(current)) return options;
  return [...options, current];
}

type SubmissionRow = Database["public"]["Tables"]["submissions"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["submission_schedules"]["Row"];
type ItemRow = Database["public"]["Tables"]["submission_items"]["Row"];
type FieldValueRow = Database["public"]["Tables"]["submission_field_values"]["Row"];
type FormFieldRow = Database["public"]["Tables"]["form_fields"]["Row"];
type InventoryItemRow = Database["public"]["Tables"]["inventory_items"]["Row"];

interface EditableItem {
  key: string;
  name: string;
  quantity: number;
  unitPrice: number;
  kind: ItemKind;
  inventoryItemId: string | null;
  stockStatus: StockStatus;
}

const STOCK_LABELS: Record<StockStatus, string> = {
  pending: "在庫未確認",
  secured: "在庫確保済み",
  denied: "在庫確保できず",
};

const STOCK_STYLES: Record<StockStatus, string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  secured: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  denied: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)]",
};

const initialState: SubmitFormState = {};

export function SubmissionForm({
  eventSlug,
  groupName,
  submission,
  items,
  fieldValues,
  fields,
  budgetAllocated,
  inventoryItems,
  inventoryAvailability,
  schedules,
  affiliationOptions,
  areaOptions,
  role,
  adminLabel,
}: {
  eventSlug: string;
  groupName: string;
  submission: SubmissionRow;
  items: ItemRow[];
  fieldValues: FieldValueRow[];
  fields: FormFieldRow[];
  budgetAllocated: number;
  inventoryItems: InventoryItemRow[];
  inventoryAvailability: Record<string, { available: number; requestedTotal: number }>;
  schedules: ScheduleRow[];
  affiliationOptions: string[];
  areaOptions: string[];
  role: "leader" | "member";
  adminLabel: string;
}) {
  const boundAction = saveSubmissionAction.bind(null, eventSlug);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const editable =
    role === "leader" &&
    (submission.status === "draft" || submission.status === "returned");
  const isUntouchedFirstVisit =
    submission.status === "draft" && !submission.name && items.length === 0;

  const [name, setName] = useState(submission.name);
  const [content, setContent] = useState(submission.content);
  const [location, setLocation] = useState(submission.location);
  const [affiliation, setAffiliation] = useState<Affiliation | "">(
    submission.affiliation ?? ""
  );
  const [area, setArea] = useState<Area | "">(submission.area ?? "");
  const [itemRows, setItemRows] = useState<EditableItem[]>(
    items.length > 0
      ? items.map((i) => ({
          key: i.id,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          kind: i.kind,
          inventoryItemId: i.inventory_item_id,
          stockStatus: i.stock_status,
        }))
      : [
          {
            key: "new-0",
            name: "",
            quantity: 1,
            unitPrice: 0,
            kind: "purchase",
            inventoryItemId: null,
            stockStatus: "pending",
          },
        ]
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
      {
        key: `new-${Date.now()}-${rows.length}`,
        name: "",
        quantity: 1,
        unitPrice: 0,
        kind: "purchase",
        inventoryItemId: null,
        stockStatus: "pending",
      },
    ]);
  }

  function removeItem(key: string) {
    setItemRows((rows) => rows.filter((r) => r.key !== key));
  }

  function setKind(key: string, kind: ItemKind) {
    setItemRows((rows) =>
      rows.map((r) =>
        r.key === key
          ? kind === "purchase"
            ? { ...r, kind, inventoryItemId: null, name: "" }
            : { ...r, kind, name: "", unitPrice: 0 }
          : r
      )
    );
  }

  function setBorrowInventoryItem(key: string, inventoryItemId: string) {
    const picked = inventoryItems.find((inv) => inv.id === inventoryItemId);
    updateItem(key, { inventoryItemId, name: picked?.name ?? "" });
  }

  const itemsJson = JSON.stringify(
    itemRows
      .filter((r) => r.name.trim().length > 0)
      .map((r) => ({
        name: r.name.trim(),
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        kind: r.kind,
        inventoryItemId: r.inventoryItemId,
      }))
  );
  const fieldValuesJson = JSON.stringify(dynamicValues);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">{groupName} の企画</h1>
        <div className="flex items-center gap-2">
          {editable && !isUntouchedFirstVisit && (
            <span className="text-[10.5px] text-[var(--muted-2)]">
              最終更新: {formatRelativeTime(submission.updated_at)}
            </span>
          )}
          <StatusBadge status={submission.status} />
        </div>
      </div>

      {schedules.length > 0 && (
        <div className="space-y-2">
          {schedules.map((s) => {
            const days = daysUntil(s.deadline);
            const style =
              days < 0
                ? "border-[var(--danger-border)] bg-[var(--status-rejected-bg)]/40 text-[var(--danger-text)]"
                : days <= 3
                ? "border-[var(--warn-border)] bg-[var(--status-returned-bg)]/40 text-[var(--warn-text)]"
                : "border-[var(--border)] bg-white text-[var(--foreground)]";
            return (
              <div
                key={s.id}
                className={`rounded-xl border px-4 py-3 text-[13px] font-medium ${style}`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span>{s.title}</span>
                  <span className="text-[11.5px] font-semibold">
                    {days < 0
                      ? "締切を過ぎています"
                      : days === 0
                      ? "本日締切"
                      : `あと${days}日`}
                  </span>
                </div>
                <p className="text-[11.5px] font-normal opacity-80 mt-0.5">
                  {formatDateTime(s.deadline)}
                  {s.hint && ` ・ ${s.hint}`}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {submission.status === "returned" && submission.admin_comment && (
        <div className="rounded-xl border border-[var(--warn-border)] bg-[var(--status-returned-bg)]/40 px-4 py-3 text-[13px] text-[var(--warn-text)]">
          <strong>差し戻し：</strong>
          {submission.admin_comment}
        </div>
      )}
      {submission.status === "rejected" && (
        <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--status-rejected-bg)]/40 px-4 py-3 text-[13px] text-[var(--danger-text)]">
          <strong>却下：</strong>
          {submission.admin_comment || "この企画は却下されました。"}
        </div>
      )}
      {submission.status === "submitted" && (
        <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[13px] text-[var(--muted)]">
          {adminLabel}の確認をお待ちください。
        </div>
      )}
      {submission.status === "approved" && (
        <div className="rounded-xl border border-[oklch(80%_0.1_150)] bg-[var(--status-approved-bg)]/40 px-4 py-3 text-[13px] text-[var(--status-approved-text)]">
          承認されました。内容の変更が必要な場合は個別コメントで{adminLabel}にご連絡ください。
        </div>
      )}
      {isUntouchedFirstVisit && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--accent-group-soft-bg)]/60 px-4 py-3 text-[13px] text-[var(--foreground)] leading-relaxed">
          はじめまして。ここから企画を提出します。企画名・内容・物品（購入／借用）・場所を入力し、
          いつでも「下書き保存」で保存できます。準備ができたら「提出する」で{adminLabel}に送信してください。
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1.5">所属区分</label>
            <select
              name="affiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value as Affiliation | "")}
              disabled={!editable}
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm bg-white disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
            >
              <option value="">未選択</option>
              {withCurrentValue(affiliationOptions, submission.affiliation ?? "").map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5">開催エリア</label>
            <select
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value as Area | "")}
              disabled={!editable}
              className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3 text-sm bg-white disabled:bg-[var(--background)] disabled:text-[var(--muted)]"
            >
              <option value="">未選択</option>
              {withCurrentValue(areaOptions, submission.area ?? "").map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">物品（購入／借用）</label>
          <p className="text-[11px] text-[var(--muted)] mb-2">
            「借用」は学校の共有備品から借りる物品です。一覧にない物品は{adminLabel}に追加を依頼してください。
            「単価」は1個あたりの金額です（借用は通常0円）。小計は自動で計算されます。
          </p>
          <div className="space-y-2.5">
            {itemRows.length === 0 && (
              <p className="border border-[var(--border-strong)] rounded-lg px-3 py-3 text-[12.5px] text-[var(--muted)]">
                物品はありません。
              </p>
            )}
            {itemRows.map((row) => (
              <div
                key={row.key}
                className="border border-[var(--border-strong)] rounded-lg p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1 text-[11px] font-semibold">
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => setKind(row.key, "purchase")}
                      className={`h-7 px-2.5 rounded-full border ${
                        row.kind === "purchase"
                          ? "bg-[var(--accent-group-soft-bg)] border-[var(--accent-group-text)] text-[var(--accent-group-text)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      購入
                    </button>
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={() => setKind(row.key, "borrow")}
                      className={`h-7 px-2.5 rounded-full border ${
                        row.kind === "borrow"
                          ? "bg-[var(--accent-group-soft-bg)] border-[var(--accent-group-text)] text-[var(--accent-group-text)]"
                          : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      借用
                    </button>
                    {row.kind === "borrow" && (
                      <span className={`status-badge ${STOCK_STYLES[row.stockStatus]}`}>
                        {STOCK_LABELS[row.stockStatus]}
                      </span>
                    )}
                  </div>
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

                {row.kind === "borrow" ? (
                  <>
                    <select
                      value={row.inventoryItemId ?? ""}
                      onChange={(e) => setBorrowInventoryItem(row.key, e.target.value)}
                      disabled={!editable}
                      className="w-full h-8 border border-[var(--border)] rounded-md px-2 text-[13px] bg-white disabled:bg-transparent disabled:border-transparent"
                    >
                      <option value="">借用する物品を選択...</option>
                      {inventoryItems.map((inv) => {
                        const available =
                          inventoryAvailability[inv.id]?.available ?? inv.total_quantity;
                        return (
                          <option key={inv.id} value={inv.id}>
                            {inv.name}（残り{Math.max(0, available)}/{inv.total_quantity}）
                          </option>
                        );
                      })}
                    </select>
                    {row.inventoryItemId &&
                      (() => {
                        const available =
                          inventoryAvailability[row.inventoryItemId]?.available ??
                          Infinity;
                        if (available >= row.quantity) return null;
                        return (
                          <p className="text-[11px] text-[var(--warn-text)]">
                            現在の在庫残りは{Math.max(0, available)}個です。希望が競合すると{adminLabel}の裁定で確保できない場合があります。
                          </p>
                        );
                      })()}
                  </>
                ) : (
                  <input
                    value={row.name}
                    onChange={(e) => updateItem(row.key, { name: e.target.value })}
                    disabled={!editable}
                    placeholder="品目名"
                    className="w-full h-8 border border-[var(--border)] rounded-md px-2 text-[13px] disabled:bg-transparent disabled:border-transparent"
                  />
                )}

                <div className="grid grid-cols-[52px_76px_76px] gap-2 text-[10px] text-[var(--muted-2)]">
                  <span>数量</span>
                  <span>単価</span>
                  <span className="text-right">小計</span>
                </div>
                <div className="grid grid-cols-[52px_76px_76px] gap-2 items-center">
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
                </div>
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

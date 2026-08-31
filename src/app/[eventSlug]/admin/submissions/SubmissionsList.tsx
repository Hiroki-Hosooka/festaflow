"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, type DisplayStatus } from "@/components/StatusBadge";
import { Icon } from "@/components/Icons";
import { yen } from "@/lib/format";
import type { SubmissionListRow } from "@/lib/data/submissions";
import type { Affiliation, Area } from "@/lib/database.types";
import { decideSubmissionAction, type DecideFormState } from "./[id]/actions";
import { yen as formatYen } from "@/lib/format";

const quickApproveInitialState: DecideFormState = {};

export function SubmissionsList({
  eventSlug,
  rows,
  affiliationOptions,
  areaOptions,
}: {
  eventSlug: string;
  rows: SubmissionListRow[];
  affiliationOptions: Affiliation[];
  areaOptions: Area[];
}) {
  const [query, setQuery] = useState("");
  const [affiliationFilter, setAffiliationFilter] = useState<Affiliation | "all">("all");
  const [areaFilter, setAreaFilter] = useState<Area | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim();
    return rows.filter((r) => {
      if (q && !r.groupName.includes(q) && !r.name.includes(q)) return false;
      if (affiliationFilter !== "all" && r.affiliation !== affiliationFilter) return false;
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      return true;
    });
  }, [rows, query, affiliationFilter, areaFilter]);

  const filteredBudgetTotal = filtered.reduce((sum, r) => sum + r.plannedTotal, 0);
  const isFiltering = affiliationFilter !== "all" || areaFilter !== "all" || query.trim() !== "";

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="団体名・企画名で検索..."
        aria-label="団体名・企画名で検索"
        className="w-full h-10 border border-[var(--border-strong)] rounded-lg px-3.5 text-[13px] bg-white"
      />

      <div className="flex flex-wrap gap-2 items-center text-[11.5px]">
        <span className="text-[var(--muted)] font-semibold">所属:</span>
        <FilterChip active={affiliationFilter === "all"} onClick={() => setAffiliationFilter("all")}>
          すべて
        </FilterChip>
        {affiliationOptions.map((a) => (
          <FilterChip
            key={a}
            active={affiliationFilter === a}
            onClick={() => setAffiliationFilter(affiliationFilter === a ? "all" : a)}
          >
            {a}
          </FilterChip>
        ))}
        <span className="text-[var(--muted)] font-semibold ml-2">エリア:</span>
        <FilterChip active={areaFilter === "all"} onClick={() => setAreaFilter("all")}>
          すべて
        </FilterChip>
        {areaOptions.map((a) => (
          <FilterChip
            key={a}
            active={areaFilter === a}
            onClick={() => setAreaFilter(areaFilter === a ? "all" : a)}
          >
            {a}
          </FilterChip>
        ))}
      </div>

      {isFiltering && (
        <p className="text-[11.5px] text-[var(--muted)]">
          絞り込み中: {filtered.length}団体 ・ 使用予定合計 {formatYen(filteredBudgetTotal)}
        </p>
      )}

      <p className="text-[11px] text-[var(--muted-2)] inline-flex items-center gap-1">
        <Icon name="calendar" className="w-3 h-3 text-[var(--accent-admin-text)]" />
        当番シフト設定済みの団体には団体名の横にこのアイコンが表示されます
      </p>

      <div className="card overflow-hidden hidden sm:block">
        <div className="grid grid-cols-[110px_1fr_130px_100px_130px] px-4 py-2.5 text-[10.5px] font-bold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
          <span>団体</span>
          <span>企画名</span>
          <span>予算（使用/配分）</span>
          <span>状態</span>
          <span />
        </div>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">該当する団体がありません。</p>
        )}
        {filtered.map((row) => (
          <TableRow key={row.groupId} eventSlug={eventSlug} row={row} />
        ))}
      </div>

      <div className="space-y-2.5 sm:hidden">
        {filtered.length === 0 && (
          <p className="card px-4 py-6 text-sm text-[var(--muted)]">
            該当する団体がありません。
          </p>
        )}
        {filtered.map((row) => (
          <CardRow key={row.groupId} eventSlug={eventSlug} row={row} />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full border ${
        active
          ? "bg-[var(--accent-admin-text)] border-[var(--accent-admin-text)] text-white font-semibold"
          : "border-[var(--border)] text-[var(--muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function affiliationAreaLabel(row: SubmissionListRow) {
  return [row.affiliation, row.area].filter(Boolean).join(" / ");
}

function actionHref(eventSlug: string, row: SubmissionListRow) {
  return row.submissionId
    ? `/${eventSlug}/admin/submissions/${row.submissionId}`
    : `/${eventSlug}/admin/messages?tab=broadcast&target=unsubmitted`;
}

function TableRow({ eventSlug, row }: { eventSlug: string; row: SubmissionListRow }) {
  const status: DisplayStatus = row.status ?? "unsubmitted";
  return (
    <div className="grid grid-cols-[110px_1fr_130px_100px_130px] px-4 py-3 items-center text-[12.5px] border-b border-[var(--border)] last:border-b-0">
      <span className="inline-flex items-center gap-1.5">
        {row.groupName}
        {row.hasUnreadFromGroup && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
            aria-label="団体からの未読コメントがあります"
          />
        )}
        {row.hasShiftConfig && (
          <span
            className="text-[var(--accent-admin-text)] flex-none"
            title="当番シフト設定済み"
          >
            <Icon name="calendar" className="w-3 h-3" />
          </span>
        )}
      </span>
      <span className={row.name ? "" : "text-[var(--muted-2)]"}>
        {row.name || "—"}
        {affiliationAreaLabel(row) && (
          <span className="block text-[10px] text-[var(--muted-2)]">
            {affiliationAreaLabel(row)}
          </span>
        )}
      </span>
      <span className="text-[11px]">
        {row.submissionId ? `${yen(row.plannedTotal)}/${yen(row.budgetAllocated)}` : "—"}
      </span>
      <span>
        <StatusBadge status={status} />
      </span>
      <div className="flex flex-col items-end gap-1">
        <Link
          href={actionHref(eventSlug, row)}
          className="text-[var(--accent-admin-text)] font-semibold text-[11.5px]"
        >
          {row.submissionId ? "確認" : "催促"}
        </Link>
        {row.status === "submitted" && row.submissionId && (
          <QuickApproveButton eventSlug={eventSlug} submissionId={row.submissionId} />
        )}
      </div>
    </div>
  );
}

function CardRow({ eventSlug, row }: { eventSlug: string; row: SubmissionListRow }) {
  const status: DisplayStatus = row.status ?? "unsubmitted";
  return (
    <div className="card px-4 py-3.5 space-y-1.5">
      <Link href={actionHref(eventSlug, row)} className="block space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[13.5px] inline-flex items-center gap-1.5">
            {row.groupName}
            {row.hasUnreadFromGroup && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
                aria-label="団体からの未読コメントがあります"
              />
            )}
            {row.hasShiftConfig && (
              <span
                className="text-[var(--accent-admin-text)] flex-none"
                title="当番シフト設定済み"
              >
                <Icon name="calendar" className="w-3 h-3" />
              </span>
            )}
          </span>
          <StatusBadge status={status} />
        </div>
        <p className={`text-[12.5px] ${row.name ? "" : "text-[var(--muted-2)]"}`}>
          {row.name || "企画名未入力"}
          {affiliationAreaLabel(row) && (
            <span className="ml-1.5 text-[10.5px] text-[var(--muted-2)]">
              {affiliationAreaLabel(row)}
            </span>
          )}
        </p>
        <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span>
            {row.submissionId ? `${yen(row.plannedTotal)} / ${yen(row.budgetAllocated)}` : "—"}
          </span>
          <span className="text-[var(--accent-admin-text)] font-semibold">
            {row.submissionId ? "確認する →" : "催促する →"}
          </span>
        </div>
      </Link>
      {row.status === "submitted" && row.submissionId && (
        <div className="pt-1.5 border-t border-[var(--border)] flex justify-end">
          <QuickApproveButton eventSlug={eventSlug} submissionId={row.submissionId} />
        </div>
      )}
    </div>
  );
}

function QuickApproveButton({
  eventSlug,
  submissionId,
}: {
  eventSlug: string;
  submissionId: string;
}) {
  const boundAction = decideSubmissionAction.bind(null, eventSlug, submissionId);
  const [state, formAction, pending] = useActionState(boundAction, quickApproveInitialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="decision" value="approved" />
      <input type="hidden" name="comment" value="" />
      <button
        disabled={pending}
        className="h-7 px-2.5 rounded-md text-[11px] font-semibold btn-approve disabled:opacity-60"
        title="購入物品のみなど、確認不要な企画をその場で承認します"
      >
        {pending ? "承認中..." : "即承認"}
      </button>
      {state.error && (
        <p className="text-[10.5px] text-[var(--danger-text)] text-right max-w-[220px] leading-snug">
          {state.error}
        </p>
      )}
    </form>
  );
}

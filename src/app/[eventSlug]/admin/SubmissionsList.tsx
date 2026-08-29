"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, type DisplayStatus } from "@/components/StatusBadge";
import { yen } from "@/lib/format";
import type { SubmissionListRow } from "@/lib/data/submissions";

export function SubmissionsList({
  eventSlug,
  rows,
}: {
  eventSlug: string;
  rows: SubmissionListRow[];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return rows;
    return rows.filter((r) => r.groupName.includes(q) || r.name.includes(q));
  }, [rows, query]);

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

      <div className="card overflow-hidden hidden sm:block">
        <div className="grid grid-cols-[110px_1fr_130px_100px_60px] px-4 py-2.5 text-[10.5px] font-bold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
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

function actionHref(eventSlug: string, row: SubmissionListRow) {
  return row.submissionId
    ? `/${eventSlug}/admin/submissions/${row.submissionId}`
    : `/${eventSlug}/admin/broadcasts?target=unsubmitted`;
}

function TableRow({ eventSlug, row }: { eventSlug: string; row: SubmissionListRow }) {
  const status: DisplayStatus = row.status ?? "unsubmitted";
  return (
    <div className="grid grid-cols-[110px_1fr_130px_100px_60px] px-4 py-3 items-center text-[12.5px] border-b border-[var(--border)] last:border-b-0">
      <span className="inline-flex items-center gap-1.5">
        {row.groupName}
        {row.hasUnreadFromGroup && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
            aria-label="団体からの未読コメントがあります"
          />
        )}
      </span>
      <span className={row.name ? "" : "text-[var(--muted-2)]"}>{row.name || "—"}</span>
      <span className="text-[11px]">
        {row.submissionId ? `${yen(row.plannedTotal)}/${yen(row.budgetAllocated)}` : "—"}
      </span>
      <span>
        <StatusBadge status={status} />
      </span>
      <Link
        href={actionHref(eventSlug, row)}
        className="text-[var(--accent-admin-text)] font-semibold text-[11.5px]"
      >
        {row.submissionId ? "確認" : "催促"}
      </Link>
    </div>
  );
}

function CardRow({ eventSlug, row }: { eventSlug: string; row: SubmissionListRow }) {
  const status: DisplayStatus = row.status ?? "unsubmitted";
  return (
    <Link href={actionHref(eventSlug, row)} className="card block px-4 py-3.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-[13.5px] inline-flex items-center gap-1.5">
          {row.groupName}
          {row.hasUnreadFromGroup && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--accent-admin-text)] flex-none"
              aria-label="団体からの未読コメントがあります"
            />
          )}
        </span>
        <StatusBadge status={status} />
      </div>
      <p className={`text-[12.5px] ${row.name ? "" : "text-[var(--muted-2)]"}`}>
        {row.name || "企画名未入力"}
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
  );
}

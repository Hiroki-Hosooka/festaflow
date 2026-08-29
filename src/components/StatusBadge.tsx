import type { SubmissionStatus } from "@/lib/database.types";

export type DisplayStatus = SubmissionStatus | "unsubmitted";

const LABELS: Record<DisplayStatus, string> = {
  draft: "下書き",
  submitted: "確認待ち",
  approved: "承認済み",
  rejected: "却下",
  returned: "差し戻し",
  unsubmitted: "未提出",
};

const STYLES: Record<DisplayStatus, string> = {
  draft: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  submitted: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  approved: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  rejected: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)]",
  returned: "bg-[var(--status-returned-bg)] text-[var(--status-returned-text)]",
  unsubmitted: "bg-[var(--status-unsubmitted-bg)] text-[var(--status-unsubmitted-text)]",
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  return <span className={`status-badge ${STYLES[status]}`}>{LABELS[status]}</span>;
}

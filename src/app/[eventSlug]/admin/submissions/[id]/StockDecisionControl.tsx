"use client";

import { useState } from "react";
import { setStockDecisionAction } from "./actions";
import type { StockStatus } from "@/lib/database.types";

const STOCK_LABELS: Record<StockStatus, string> = {
  pending: "未確認",
  secured: "確保済み",
  denied: "確保できず",
};

const STOCK_STYLES: Record<StockStatus, string> = {
  pending: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  secured: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
  denied: "bg-[var(--status-rejected-bg)] text-[var(--status-rejected-text)]",
};

export function StockDecisionControl({
  eventSlug,
  submissionId,
  submissionItemId,
  requestedQuantity,
  stockStatus,
  securedQuantity,
}: {
  eventSlug: string;
  submissionId: string;
  submissionItemId: string;
  requestedQuantity: number;
  stockStatus: StockStatus;
  securedQuantity: number;
}) {
  const boundAction = setStockDecisionAction.bind(
    null,
    eventSlug,
    submissionId,
    submissionItemId
  );
  const [secureQty, setSecureQty] = useState(
    stockStatus === "secured" ? securedQuantity : requestedQuantity
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={`status-badge ${STOCK_STYLES[stockStatus]}`}>
        {STOCK_LABELS[stockStatus]}
        {stockStatus === "secured" && `（${securedQuantity}個）`}
      </span>
      <form action={boundAction} className="flex items-center gap-1.5">
        <input type="hidden" name="stock_status" value="secured" />
        <input
          type="number"
          name="secured_quantity"
          min={0}
          value={secureQty}
          onChange={(e) => setSecureQty(Number(e.target.value))}
          aria-label="確保する数量"
          className="h-7 w-16 border border-[var(--border-strong)] rounded-md px-1.5 text-[12px]"
        />
        <button className="h-7 px-2.5 rounded-md text-[11.5px] font-semibold btn-approve">
          確保する
        </button>
      </form>
      <form action={boundAction}>
        <input type="hidden" name="stock_status" value="denied" />
        <button className="h-7 px-2.5 rounded-md text-[11.5px] font-semibold border border-[var(--danger-border)] text-[var(--danger-text)]">
          確保できず
        </button>
      </form>
      {stockStatus !== "pending" && (
        <form action={boundAction}>
          <input type="hidden" name="stock_status" value="pending" />
          <button className="h-7 px-2.5 rounded-md text-[11.5px] text-[var(--muted)] border border-[var(--border)]">
            未確認に戻す
          </button>
        </form>
      )}
    </div>
  );
}

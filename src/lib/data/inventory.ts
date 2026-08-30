import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { StockStatus } from "@/lib/database.types";

export async function listInventoryItems(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("inventory_items")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createInventoryItem(params: {
  eventId: string;
  name: string;
  totalQuantity: number;
  notes: string;
}) {
  const { error } = await supabaseAdmin().from("inventory_items").insert({
    event_id: params.eventId,
    name: params.name,
    total_quantity: params.totalQuantity,
    notes: params.notes,
  });
  if (error) throw error;
}

export async function updateInventoryItem(
  inventoryItemId: string,
  params: { totalQuantity: number; notes: string }
) {
  const { error } = await supabaseAdmin()
    .from("inventory_items")
    .update({
      total_quantity: params.totalQuantity,
      notes: params.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inventoryItemId);
  if (error) throw error;
}

export async function deleteInventoryItem(inventoryItemId: string) {
  const { error } = await supabaseAdmin()
    .from("inventory_items")
    .delete()
    .eq("id", inventoryItemId);
  if (error) throw error;
}

export interface BorrowRequestRow {
  submissionItemId: string;
  submissionId: string;
  groupName: string;
  itemName: string;
  quantity: number;
  stockStatus: StockStatus;
  securedQuantity: number;
}

export interface InventoryUsage {
  inventoryItemId: string;
  totalQuantity: number;
  securedTotal: number;
  requestedTotal: number;
  available: number;
  requests: BorrowRequestRow[];
}

/**
 * イベント内の全借用希望を在庫物品ごとに集計する。
 * バッティング（同一物品への複数団体からの希望競合）を管理側が見て裁定するための材料。
 */
export async function getInventoryUsage(eventId: string): Promise<Map<string, InventoryUsage>> {
  const db = supabaseAdmin();

  // 3クエリとも event_id のみに依存し互いに独立しているため並列実行する
  const [
    { data: inventoryItems, error: invErr },
    { data: submissions, error: subErr },
    { data: groups, error: grpErr },
  ] = await Promise.all([
    db.from("inventory_items").select("*").eq("event_id", eventId),
    db.from("submissions").select("id, group_id").eq("event_id", eventId),
    db.from("groups").select("id, name").eq("event_id", eventId),
  ]);
  if (invErr) throw invErr;
  if (subErr) throw subErr;
  if (grpErr) throw grpErr;

  const usage = new Map<string, InventoryUsage>();
  for (const inv of inventoryItems ?? []) {
    usage.set(inv.id, {
      inventoryItemId: inv.id,
      totalQuantity: inv.total_quantity,
      securedTotal: 0,
      requestedTotal: 0,
      available: inv.total_quantity,
      requests: [],
    });
  }
  if (usage.size === 0) return usage;

  const submissionIds = (submissions ?? []).map((s) => s.id);
  if (submissionIds.length === 0) return usage;

  const groupNameBySubmission = new Map(
    (submissions ?? []).map((s) => [
      s.id,
      (groups ?? []).find((g) => g.id === s.group_id)?.name ?? "不明な団体",
    ])
  );

  const { data: items, error: itemsErr } = await db
    .from("submission_items")
    .select("*")
    .eq("kind", "borrow")
    .in("submission_id", submissionIds)
    .not("inventory_item_id", "is", null);
  if (itemsErr) throw itemsErr;

  for (const item of items ?? []) {
    if (!item.inventory_item_id) continue;
    const bucket = usage.get(item.inventory_item_id);
    if (!bucket) continue;

    bucket.requests.push({
      submissionItemId: item.id,
      submissionId: item.submission_id,
      groupName: groupNameBySubmission.get(item.submission_id) ?? "不明な団体",
      itemName: item.name,
      quantity: item.quantity,
      stockStatus: item.stock_status,
      securedQuantity: item.secured_quantity,
    });

    if (item.stock_status !== "denied") {
      bucket.requestedTotal += item.quantity;
    }
    if (item.stock_status === "secured") {
      bucket.securedTotal += item.secured_quantity;
    }
  }

  for (const bucket of usage.values()) {
    bucket.available = bucket.totalQuantity - bucket.securedTotal;
  }

  return usage;
}

export async function setStockDecision(
  submissionItemId: string,
  decision: { stockStatus: StockStatus; securedQuantity: number }
) {
  const { error } = await supabaseAdmin()
    .from("submission_items")
    .update({
      stock_status: decision.stockStatus,
      secured_quantity: decision.securedQuantity,
    })
    .eq("id", submissionItemId);
  if (error) throw error;
}

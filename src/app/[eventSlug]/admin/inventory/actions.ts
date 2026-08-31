"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  upsertInventoryItemByName,
} from "@/lib/data/inventory";
import { parseCsv } from "@/lib/csv";

export interface InventoryFormState {
  error?: string;
  success?: string;
}

export async function createInventoryItemAction(
  eventSlug: string,
  _prevState: InventoryFormState,
  formData: FormData
): Promise<InventoryFormState> {
  const auth = await requireAdminSession(eventSlug);

  const name = String(formData.get("name") ?? "").trim();
  const totalQuantity = Math.max(0, Math.floor(Number(formData.get("total_quantity")) || 0));
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) {
    return { error: "物品名を入力してください。" };
  }

  try {
    await createInventoryItem({ eventId: auth.eventId, name, totalQuantity, notes });
  } catch {
    return { error: "登録に失敗しました。同じ物品名がすでに存在しないか確認してください。" };
  }

  revalidatePath(`/${eventSlug}/admin/inventory`);
  revalidatePath(`/${eventSlug}/group/submission`);
  return { success: `「${name}」を追加しました。` };
}

export async function updateInventoryItemAction(
  eventSlug: string,
  inventoryItemId: string,
  formData: FormData
) {
  await requireAdminSession(eventSlug);
  const totalQuantity = Math.max(0, Math.floor(Number(formData.get("total_quantity")) || 0));
  const notes = String(formData.get("notes") ?? "").trim();
  await updateInventoryItem(inventoryItemId, { totalQuantity, notes });
  revalidatePath(`/${eventSlug}/admin/inventory`);
}

export async function deleteInventoryItemAction(eventSlug: string, inventoryItemId: string) {
  await requireAdminSession(eventSlug);
  await deleteInventoryItem(inventoryItemId);
  revalidatePath(`/${eventSlug}/admin/inventory`);
  revalidatePath(`/${eventSlug}/group/submission`);
}

export interface ImportCsvFormState {
  error?: string;
  success?: string;
}

export async function importInventoryCsvAction(
  eventSlug: string,
  _prevState: ImportCsvFormState,
  formData: FormData
): Promise<ImportCsvFormState> {
  const auth = await requireAdminSession(eventSlug);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "CSVファイルを選択してください。" };
  }

  const rows = parseCsv(await file.text());
  if (rows.length === 0) {
    return { error: "CSVにデータがありません。" };
  }
  const looksLikeHeader = /物品名|name/i.test(rows[0][0] ?? "");
  const records = looksLikeHeader ? rows.slice(1) : rows;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const r of records) {
    const name = (r[0] ?? "").trim();
    if (!name) {
      skipped++;
      continue;
    }
    const totalQuantity = Math.max(0, Math.floor(Number(r[1]) || 0));
    const notes = (r[2] ?? "").trim();
    const result = await upsertInventoryItemByName(auth.eventId, name, totalQuantity, notes);
    if (result === "created") created++;
    else updated++;
  }

  revalidatePath(`/${eventSlug}/admin/inventory`);
  revalidatePath(`/${eventSlug}/group/submission`);
  return {
    success: `${updated}件更新、${created}件追加しました。${
      skipped > 0 ? `（物品名が空の${skipped}行はスキップしました）` : ""
    }`,
  };
}

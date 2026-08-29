"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "@/lib/data/inventory";

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
  revalidatePath(`/${eventSlug}/group`);
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
  revalidatePath(`/${eventSlug}/group`);
}

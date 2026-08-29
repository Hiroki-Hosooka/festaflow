"use client";

import { deleteInventoryItemAction } from "./actions";

export function DeleteInventoryItemButton({
  eventSlug,
  inventoryItemId,
}: {
  eventSlug: string;
  inventoryItemId: string;
}) {
  return (
    <form
      action={deleteInventoryItemAction.bind(null, eventSlug, inventoryItemId)}
      onSubmit={(e) => {
        if (
          !confirm(
            "この物品を削除しますか？すでにこの物品を借用申請している企画からも参照が外れます。"
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button className="text-[11.5px] text-[var(--danger-text)] font-semibold">削除</button>
    </form>
  );
}

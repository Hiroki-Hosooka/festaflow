"use client";

import { deleteFieldAction } from "./actions";

export function DeleteFieldButton({
  eventSlug,
  fieldId,
}: {
  eventSlug: string;
  fieldId: string;
}) {
  return (
    <form
      action={deleteFieldAction.bind(null, eventSlug, fieldId)}
      onSubmit={(e) => {
        if (!confirm("この項目を削除しますか？入力済みの内容も削除されます。")) {
          e.preventDefault();
        }
      }}
    >
      <button className="text-[11.5px] text-[var(--danger-text)] font-semibold">削除</button>
    </form>
  );
}

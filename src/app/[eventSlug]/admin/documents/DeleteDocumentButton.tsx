"use client";

import { deleteDocumentAction } from "./actions";

export function DeleteDocumentButton({
  eventSlug,
  documentId,
}: {
  eventSlug: string;
  documentId: string;
}) {
  const boundDelete = deleteDocumentAction.bind(null, eventSlug, documentId);
  return (
    <form
      action={boundDelete}
      onSubmit={(e) => {
        if (!confirm("この資料を削除しますか？")) e.preventDefault();
      }}
    >
      <button className="text-[11.5px] text-[var(--danger-text)] font-semibold">削除</button>
    </form>
  );
}

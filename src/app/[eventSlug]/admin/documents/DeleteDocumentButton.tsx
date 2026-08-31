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
      <button className="btn-row btn-row-danger">削除</button>
    </form>
  );
}

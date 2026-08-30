import { requireAdminSession } from "@/lib/session";
import { listEventDocuments } from "@/lib/data/documents";
import { createSignedUrls } from "@/lib/storage";
import { formatDateTime } from "@/lib/format";
import { NewDocumentForm } from "./NewDocumentForm";
import { DeleteDocumentButton } from "./DeleteDocumentButton";
import { EmptyState } from "@/components/EmptyState";

export default async function AdminDocumentsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const documents = await listEventDocuments(auth.eventId);
  const urlsByPath = await createSignedUrls(documents.map((d) => d.storage_path));
  const withUrls = documents.map((d) => ({ ...d, url: urlsByPath.get(d.storage_path) ?? "" }));

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold">配布資料</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed">
          ここでアップロードした資料は、全団体のポータルに一覧表示されます。
        </p>
      </div>

      <div className="card p-6 space-y-3">
        <div className="text-xs font-bold text-[var(--muted)]">資料を追加</div>
        <NewDocumentForm eventSlug={eventSlug} />
      </div>

      <div className="card overflow-hidden">
        {withUrls.length === 0 && (
          <EmptyState
            icon="document"
            title="まだ資料はありません"
            description="上のフォームから資料を追加すると、全団体のポータルに表示されます。"
          />
        )}
        {withUrls.map((d) => (
          <div
            key={d.id}
            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 text-[13px]"
          >
            <a href={d.url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-admin-text)]">
              {d.file_name}
            </a>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--muted-2)]">
                {formatDateTime(d.uploaded_at)}
              </span>
              <DeleteDocumentButton eventSlug={eventSlug} documentId={d.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

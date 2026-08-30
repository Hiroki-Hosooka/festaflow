import { requireGroupSession } from "@/lib/session";
import { listEventDocuments } from "@/lib/data/documents";
import { createSignedUrls } from "@/lib/storage";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export default async function GroupDocumentsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);
  const documents = await listEventDocuments(auth.eventId);
  const urlsByPath = await createSignedUrls(documents.map((d) => d.storage_path));
  const withUrls = documents.map((d) => ({ ...d, url: urlsByPath.get(d.storage_path) ?? "" }));

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold">配布資料</h1>
      <div className="card overflow-hidden">
        {withUrls.length === 0 && (
          <EmptyState
            icon="document"
            title="まだ資料はありません"
            description="実行委員会が資料をアップロードすると、ここに表示されます。"
          />
        )}
        {withUrls.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] last:border-b-0 text-[13px] hover:bg-[var(--background)]"
          >
            <span className="font-semibold text-[var(--accent-group-text)]">{d.file_name}</span>
            <span className="text-[11px] text-[var(--muted-2)]">
              {formatDateTime(d.uploaded_at)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

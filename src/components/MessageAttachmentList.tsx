import { Icon } from "./Icons";

export function MessageAttachmentList({
  attachments,
}: {
  attachments: { file_name: string; url: string }[];
}) {
  if (attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {attachments.map((a, i) => (
        <a
          key={i}
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-[11px] font-medium hover:border-[var(--border-strong)] max-w-[180px]"
        >
          <Icon name="document" className="w-3 h-3 flex-none text-[var(--muted)]" />
          <span className="truncate">{a.file_name}</span>
        </a>
      ))}
    </div>
  );
}


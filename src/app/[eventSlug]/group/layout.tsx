import Link from "next/link";
import { requireGroupSession } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listUnreadSubmissionIds } from "@/lib/data/comments";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);
  const boundLogout = logoutAction.bind(null, eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const unreadIds = await listUnreadSubmissionIds([submission.id], "group");
  const hasUnread = unreadIds.has(submission.id);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="font-bold text-sm">{auth.groupName}</span>
            <nav className="flex gap-4 text-[13px]">
              <Link href={`/${eventSlug}/group`}>企画</Link>
              <Link
                href={`/${eventSlug}/group/messages`}
                className="text-[var(--muted)] inline-flex items-center gap-1.5"
              >
                連絡・コメント
                {hasUnread && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[var(--accent-group-text)]"
                    aria-label="未読のコメントがあります"
                  />
                )}
              </Link>
            </nav>
          </div>
          <form action={boundLogout}>
            <button className="text-xs text-[var(--accent-group-text)] font-semibold">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

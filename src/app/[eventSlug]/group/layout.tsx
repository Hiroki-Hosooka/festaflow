import { requireGroupSession } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listUnreadSubmissionIds } from "@/lib/data/comments";
import { NavBar } from "@/components/NavBar";

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
      <NavBar
        brand={auth.groupName}
        accentTextClass="text-[var(--accent-group-text)]"
        badgeClass="bg-[var(--accent-group-text)]"
        logoutAction={boundLogout}
        links={[
          { href: `/${eventSlug}/group`, label: "企画" },
          {
            href: `/${eventSlug}/group/messages`,
            label: "連絡・コメント",
            badge: hasUnread,
            badgeLabel: "未読のコメントがあります",
          },
          { href: `/${eventSlug}/group/settings`, label: "合言葉の変更" },
        ]}
      />
      <div className="max-w-3xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

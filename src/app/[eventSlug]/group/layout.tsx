import { requireGroupSession } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listUnreadSubmissionIds } from "@/lib/data/comments";
import { NavBar, type NavLinkItem } from "@/components/NavBar";
import { Icon } from "@/components/Icons";

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

  const links: NavLinkItem[] = [
    { href: `/${eventSlug}/group`, label: "企画", icon: <Icon name="clipboard" /> },
    {
      href: `/${eventSlug}/group/messages`,
      label: "連絡・コメント",
      icon: <Icon name="chat" />,
      badge: hasUnread,
      badgeLabel: "未読のコメントがあります",
    },
    { href: `/${eventSlug}/group/shifts`, label: "当番シフト", icon: <Icon name="calendar" /> },
    { href: `/${eventSlug}/group/todos`, label: "ToDoリスト", icon: <Icon name="checkSquare" /> },
    { href: `/${eventSlug}/group/documents`, label: "配布資料", icon: <Icon name="document" /> },
  ];
  if (auth.role === "leader") {
    links.push({
      href: `/${eventSlug}/group/settings`,
      label: "合言葉の変更",
      icon: <Icon name="key" />,
    });
  }

  return (
    <div className="min-h-screen">
      <NavBar
        brand={
          <span className="inline-flex items-center gap-2">
            {auth.groupName}
            <span
              className={`status-badge ${
                auth.role === "leader"
                  ? "bg-[var(--accent-group-soft-bg)] text-[var(--accent-group-text)]"
                  : "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]"
              }`}
            >
              {auth.role === "leader" ? "クラスリーダー" : "一般生徒"}
            </span>
          </span>
        }
        accentTextClass="text-[var(--accent-group-text)]"
        badgeClass="bg-[var(--accent-group-text)]"
        logoutAction={boundLogout}
        links={links}
      />
      <div className="max-w-3xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

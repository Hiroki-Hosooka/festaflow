import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listInboxThreads } from "@/lib/data/comments";
import { logoutAction } from "../login/actions";
import { NavBar } from "@/components/NavBar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const event = await getEventBySlug(eventSlug);
  const boundLogout = logoutAction.bind(null, eventSlug);

  const inventoryUsage = await getInventoryUsage(auth.eventId);
  const hasInventoryConflict = Array.from(inventoryUsage.values()).some(
    (u) => u.requestedTotal > u.totalQuantity
  );

  const inboxThreads = await listInboxThreads(auth.eventId);
  const hasUnreadInbox = inboxThreads.some((t) => t.hasUnreadFromGroup);

  return (
    <div className="min-h-screen">
      <NavBar
        brand={event?.name ?? "管理画面"}
        accentTextClass="text-[var(--accent-admin-text)]"
        badgeClass="bg-[var(--danger-text)]"
        logoutAction={boundLogout}
        links={[
          { href: `/${eventSlug}/admin`, label: "企画一覧", icon: "🗂️" },
          {
            href: `/${eventSlug}/admin/inbox`,
            label: "受信箱",
            icon: "📥",
            badge: hasUnreadInbox,
            badgeLabel: "未読の個別コメントがあります",
          },
          { href: `/${eventSlug}/admin/broadcasts`, label: "連絡", icon: "📣" },
          { href: `/${eventSlug}/admin/groups`, label: "団体・予算", icon: "👥" },
          { href: `/${eventSlug}/admin/fields`, label: "提出項目", icon: "🧾" },
          {
            href: `/${eventSlug}/admin/inventory`,
            label: "在庫管理",
            icon: "📦",
            badge: hasInventoryConflict,
            badgeLabel: "在庫の希望が競合している物品があります",
          },
          { href: `/${eventSlug}/admin/documents`, label: "配布資料", icon: "📄" },
        ]}
      />
      <div className="max-w-4xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

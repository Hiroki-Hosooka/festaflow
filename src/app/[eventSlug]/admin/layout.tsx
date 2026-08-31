import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listInboxThreads } from "@/lib/data/comments";
import { logoutAction } from "../login/actions";
import { NavBar } from "@/components/NavBar";
import { Icon } from "@/components/Icons";
import { BrandMark } from "@/components/BrandMark";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const boundLogout = logoutAction.bind(null, eventSlug);

  const [event, inventoryUsage, inboxThreads] = await Promise.all([
    getEventBySlug(eventSlug),
    getInventoryUsage(auth.eventId),
    listInboxThreads(auth.eventId),
  ]);
  const hasInventoryConflict = Array.from(inventoryUsage.values()).some(
    (u) => u.requestedTotal > u.totalQuantity
  );
  const hasUnreadInbox = inboxThreads.some((t) => t.hasUnreadFromGroup);

  return (
    <div className="min-h-screen">
      <NavBar
        brand={
          <span className="inline-flex items-center gap-2">
            <BrandMark accent="var(--accent-admin-solid)" className="w-[18px] h-[18px]" />
            {event?.name ?? "管理画面"}
          </span>
        }
        homeHref={`/${eventSlug}/admin`}
        accentTextClass="text-[var(--accent-admin-text)]"
        badgeClass="bg-[var(--danger-text)]"
        maxWidthClassName="max-w-6xl"
        logoutAction={boundLogout}
        links={[
          {
            href: `/${eventSlug}/admin/submissions`,
            label: "企画一覧",
            icon: <Icon name="clipboard" />,
          },
          {
            href: `/${eventSlug}/admin/messages`,
            label: "連絡",
            icon: <Icon name="inbox" />,
            badge: hasUnreadInbox,
            badgeLabel: "未読の個別コメントがあります",
          },
        ]}
        secondaryLinks={[
          {
            href: `/${eventSlug}/admin/inventory`,
            label: "在庫管理",
            icon: <Icon name="package" />,
            badge: hasInventoryConflict,
            badgeLabel: "在庫の希望が競合している物品があります",
          },
          { href: `/${eventSlug}/admin/groups`, label: "団体・予算", icon: <Icon name="users" /> },
          {
            href: `/${eventSlug}/admin/form-settings`,
            label: "フォーム設定",
            icon: <Icon name="receipt" />,
          },
          {
            href: `/${eventSlug}/admin/documents`,
            label: "配布資料",
            icon: <Icon name="document" />,
          },
          { href: `/${eventSlug}/admin/settings`, label: "設定", icon: <Icon name="settings" /> },
        ]}
      />
      <div className="max-w-6xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

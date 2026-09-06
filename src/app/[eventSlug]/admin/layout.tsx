import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { getInventoryUsage } from "@/lib/data/inventory";
import { listInboxThreads } from "@/lib/data/comments";
import { logoutAction } from "../login/actions";
import { NavBar, type NavLinkItem } from "@/components/NavBar";
import { Icon } from "@/components/Icons";
import { BrandMark } from "@/components/BrandMark";
import { ADMIN_NAV_REGISTRY, resolveNavConfig } from "@/lib/navRegistry";

const PRIMARY_COUNT = 2;

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

  const badgesByKey: Record<string, { badge: boolean; badgeLabel: string }> = {
    messages: { badge: hasUnreadInbox, badgeLabel: "未読の個別コメントがあります" },
    inventory: { badge: hasInventoryConflict, badgeLabel: "在庫の希望が競合している物品があります" },
  };

  const registryByKey = new Map(ADMIN_NAV_REGISTRY.map((item) => [item.key, item]));
  const config = resolveNavConfig(ADMIN_NAV_REGISTRY, event?.admin_nav_config ?? null);
  const orderedLinks: NavLinkItem[] = config
    .filter((entry) => entry.visible)
    .map((entry) => registryByKey.get(entry.key))
    .filter((item): item is (typeof ADMIN_NAV_REGISTRY)[number] => !!item)
    .map((item) => ({
      href: `/${eventSlug}${item.hrefSuffix}`,
      label: item.label,
      icon: <Icon name={item.icon as React.ComponentProps<typeof Icon>["name"]} />,
      ...badgesByKey[item.key],
    }));

  const links = orderedLinks.slice(0, PRIMARY_COUNT);
  const secondaryLinks = orderedLinks.slice(PRIMARY_COUNT);

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
        links={links}
        secondaryLinks={secondaryLinks}
      />
      <div className="max-w-6xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

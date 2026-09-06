import { requireGroupSession } from "@/lib/session";
import { logoutAction } from "../login/actions";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { hasUnreadForSubmission } from "@/lib/data/comments";
import { getEventBySlug } from "@/lib/data/events";
import { NavBar, type NavLinkItem } from "@/components/NavBar";
import { Icon } from "@/components/Icons";
import { BrandMark } from "@/components/BrandMark";
import { GROUP_NAV_REGISTRY, resolveNavConfig } from "@/lib/navRegistry";

const PRIMARY_COUNT = 2;

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

  const [event, submission] = await Promise.all([
    getEventBySlug(eventSlug),
    getOrCreateSubmission(auth.eventId, auth.groupId),
  ]);
  const hasUnread = await hasUnreadForSubmission(submission.id, "group");

  const badgesByKey: Record<string, { badge: boolean; badgeLabel: string }> = {
    messages: { badge: hasUnread, badgeLabel: "未読のコメントがあります" },
  };

  const registryByKey = new Map(GROUP_NAV_REGISTRY.map((item) => [item.key, item]));
  const config = resolveNavConfig(GROUP_NAV_REGISTRY, event?.group_nav_config ?? null);
  const orderedLinks: NavLinkItem[] = config
    .filter((entry) => entry.visible)
    .filter((entry) => auth.role === "leader" || entry.key !== "settings")
    .map((entry) => registryByKey.get(entry.key))
    .filter((item): item is (typeof GROUP_NAV_REGISTRY)[number] => !!item)
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
            <BrandMark className="w-[18px] h-[18px]" />
            <span className="font-bold">{auth.groupName}</span>
            <span
              className={`status-badge hidden sm:inline-flex ${
                auth.role === "leader"
                  ? "bg-[var(--accent-group-soft-bg)] text-[var(--accent-group-text)]"
                  : "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]"
              }`}
            >
              {auth.role === "leader" ? "クラスリーダー" : "一般生徒"}
            </span>
          </span>
        }
        homeHref={`/${eventSlug}/group`}
        accentTextClass="text-[var(--accent-group-text)]"
        badgeClass="bg-[var(--accent-group-text)]"
        logoutAction={boundLogout}
        links={links}
        secondaryLinks={secondaryLinks}
      />
      <div className="max-w-5xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

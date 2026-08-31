import Link from "next/link";
import { Icon } from "./Icons";

export function HubTile({
  href,
  icon,
  label,
  description,
  badgeCount,
  badgeTone = "accent",
  accent,
}: {
  href: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  description?: string;
  badgeCount?: number;
  badgeTone?: "accent" | "danger";
  accent: "admin" | "group";
}) {
  const accentVar = accent === "admin" ? "var(--accent-admin-text)" : "var(--accent-group-text)";
  const softBg = accent === "admin" ? "var(--accent-admin-soft-bg)" : "var(--accent-group-soft-bg)";

  return (
    <Link
      href={href}
      className="card p-4 flex items-start gap-3 hover:border-[var(--border-strong)] hover:shadow-sm transition-[border-color,box-shadow]"
    >
      <span
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-none"
        style={{ background: softBg, color: accentVar }}
      >
        <Icon name={icon} className="w-4 h-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-[13.5px]">{label}</span>
          {!!badgeCount && (
            <span
              className={`status-badge ${
                badgeTone === "danger"
                  ? "bg-[var(--status-rejected-bg)] text-[var(--danger-text)]"
                  : ""
              }`}
              style={badgeTone === "accent" ? { background: softBg, color: accentVar } : undefined}
            >
              {badgeCount}
            </span>
          )}
        </span>
        {description && (
          <span className="block text-[11.5px] text-[var(--muted)] mt-0.5 leading-snug">
            {description}
          </span>
        )}
      </span>
      <span className="text-[var(--muted-2)] flex-none self-center" aria-hidden="true">
        <Icon name="chevronRight" className="w-4 h-4" />
      </span>
    </Link>
  );
}

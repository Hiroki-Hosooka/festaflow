import Link from "next/link";
import { Icon } from "./Icons";

export function SmallTile({
  href,
  icon,
  label,
  accent,
  badgeCount,
  badgeTone = "accent",
}: {
  href: string;
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  accent: "admin" | "group";
  badgeCount?: number;
  badgeTone?: "accent" | "danger";
}) {
  const accentVar = accent === "admin" ? "var(--accent-admin-text)" : "var(--accent-group-text)";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-[12px] font-semibold hover:border-[var(--border-strong)] hover:bg-[var(--background)] transition-colors"
    >
      <span className="inline-flex w-3.5 h-3.5" style={{ color: accentVar }}>
        <Icon name={icon} className="w-3.5 h-3.5" />
      </span>
      {label}
      {!!badgeCount && (
        <span
          className={`w-1.5 h-1.5 rounded-full flex-none ${
            badgeTone === "danger" ? "bg-[var(--danger-text)]" : ""
          }`}
          style={badgeTone === "accent" ? { background: accentVar } : undefined}
          aria-label="要対応あり"
        />
      )}
    </Link>
  );
}

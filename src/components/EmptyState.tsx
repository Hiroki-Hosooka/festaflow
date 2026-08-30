import { Icon } from "./Icons";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  title: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon name={icon} className="w-5 h-5" />
      </span>
      <p className="text-[13px] font-semibold text-[var(--foreground)]">{title}</p>
      {description && (
        <p className="text-[12px] leading-relaxed max-w-xs text-[var(--muted)]">{description}</p>
      )}
    </div>
  );
}

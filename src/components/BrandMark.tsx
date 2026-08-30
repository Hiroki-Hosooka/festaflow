import { Icon } from "./Icons";

export function BrandMark({
  accent = "var(--accent-group-solid)",
  className = "w-5 h-5",
}: {
  accent?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md flex-none ${className}`}
      style={{ background: accent }}
    >
      <Icon name="flag" className="w-3 h-3 text-white" />
    </span>
  );
}

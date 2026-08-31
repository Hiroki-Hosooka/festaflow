import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="現在地" className="flex items-center gap-1.5 text-[12px] text-[var(--muted)] flex-wrap">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden="true" className="text-[var(--muted-2)]">
              /
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="hover:text-[var(--foreground)] hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--foreground)] font-semibold">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

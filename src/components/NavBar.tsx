"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: boolean;
  badgeLabel?: string;
}

export function NavBar({
  brand,
  links,
  logoutAction,
  accentTextClass,
  badgeClass,
}: {
  brand: React.ReactNode;
  links: NavLinkItem[];
  logoutAction: (formData: FormData) => void | Promise<void>;
  accentTextClass: string;
  badgeClass: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-20 print:hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-5 h-14 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden flex-none w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-[var(--foreground)] active:bg-[var(--background)]"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
        >
          <span className="text-base leading-none">{open ? "✕" : "☰"}</span>
        </button>
        <span className="font-bold text-sm truncate flex-none max-w-[45%] lg:max-w-none">
          {brand}
        </span>
        <nav className="hidden lg:flex gap-4 text-[13px] flex-1 min-w-0">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
                isActive(l.href) ? "font-bold" : "text-[var(--muted)]"
              }`}
            >
              {l.icon && (
                <span aria-hidden="true" className="inline-flex w-4 h-4 flex-none">
                  {l.icon}
                </span>
              )}
              {l.label}
              {l.badge && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${badgeClass}`}
                  aria-label={l.badgeLabel ?? "未読・要対応あり"}
                />
              )}
            </Link>
          ))}
        </nav>
        <form action={logoutAction} className="flex-none ml-auto">
          <button className={`text-xs font-semibold ${accentTextClass}`}>ログアウト</button>
        </form>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-[var(--border)] px-4 py-1.5 flex flex-col text-[13.5px]">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`inline-flex items-center gap-1.5 py-2.5 ${
                isActive(l.href) ? "font-bold" : "text-[var(--muted)]"
              }`}
            >
              {l.icon && (
                <span aria-hidden="true" className="inline-flex w-4 h-4 flex-none">
                  {l.icon}
                </span>
              )}
              {l.label}
              {l.badge && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${badgeClass}`}
                  aria-label={l.badgeLabel ?? "未読・要対応あり"}
                />
              )}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

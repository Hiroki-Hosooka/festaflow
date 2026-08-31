"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icons";

export interface NavLinkItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badge?: boolean;
  badgeLabel?: string;
}

function NavLinkRow({
  link,
  active,
  badgeClass,
  onClick,
  className,
}: {
  link: NavLinkItem;
  active: boolean;
  badgeClass: string;
  onClick?: () => void;
  className: string;
}) {
  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={`${className} ${active ? "font-bold" : "text-[var(--muted)]"}`}
    >
      {link.icon && (
        <span aria-hidden="true" className="inline-flex w-4 h-4 flex-none">
          {link.icon}
        </span>
      )}
      {link.label}
      {link.badge && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${badgeClass}`}
          aria-label={link.badgeLabel ?? "未読・要対応あり"}
        />
      )}
    </Link>
  );
}

export function NavBar({
  brand,
  homeHref,
  links,
  secondaryLinks = [],
  logoutAction,
  accentTextClass,
  badgeClass,
}: {
  brand: React.ReactNode;
  homeHref: string;
  links: NavLinkItem[];
  secondaryLinks?: NavLinkItem[];
  logoutAction: (formData: FormData) => void | Promise<void>;
  accentTextClass: string;
  badgeClass: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => pathname === href;
  const hasSecondaryBadge = secondaryLinks.some((l) => l.badge);

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
        <Link
          href={homeHref}
          className="font-bold text-sm truncate flex-none max-w-[45%] lg:max-w-none"
        >
          {brand}
        </Link>
        <nav className="hidden lg:flex items-center gap-4 text-[13px] flex-1 min-w-0">
          {links.map((l) => (
            <NavLinkRow
              key={l.href}
              link={l}
              active={isActive(l.href)}
              badgeClass={badgeClass}
              className="inline-flex items-center gap-1.5 whitespace-nowrap"
            />
          ))}
          {secondaryLinks.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap text-[var(--muted)]"
                aria-label={moreOpen ? "その他のメニューを閉じる" : "その他のメニューを開く"}
                aria-expanded={moreOpen}
              >
                <span aria-hidden="true" className="inline-flex w-4 h-4 flex-none">
                  <Icon name="settings" />
                </span>
                その他
                {hasSecondaryBadge && (
                  <span className={`w-1.5 h-1.5 rounded-full ${badgeClass}`} aria-hidden="true" />
                )}
              </button>
              {moreOpen && (
                <nav className="absolute left-0 top-full mt-2 w-44 card p-1.5 flex flex-col text-[13px] shadow-lg">
                  {secondaryLinks.map((l) => (
                    <NavLinkRow
                      key={l.href}
                      link={l}
                      active={isActive(l.href)}
                      badgeClass={badgeClass}
                      onClick={() => setMoreOpen(false)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-md hover:bg-[var(--background)]"
                    />
                  ))}
                </nav>
              )}
            </div>
          )}
        </nav>
        <form action={logoutAction} className="flex-none ml-auto">
          <button className={`text-xs font-semibold ${accentTextClass}`}>ログアウト</button>
        </form>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-[var(--border)] px-4 py-1.5 flex flex-col text-[13.5px]">
          {[...links, ...secondaryLinks].map((l) => (
            <NavLinkRow
              key={l.href}
              link={l}
              active={isActive(l.href)}
              badgeClass={badgeClass}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 py-2.5"
            />
          ))}
        </nav>
      )}
    </header>
  );
}

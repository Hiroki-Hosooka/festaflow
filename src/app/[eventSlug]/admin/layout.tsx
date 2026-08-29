import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { getEventBySlug } from "@/lib/data/events";
import { logoutAction } from "../login/actions";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  await requireAdminSession(eventSlug);
  const event = await getEventBySlug(eventSlug);
  const boundLogout = logoutAction.bind(null, eventSlug);

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <span className="font-bold text-sm">{event?.name ?? "管理画面"}</span>
            <nav className="flex gap-4 text-[13px] flex-wrap">
              <Link href={`/${eventSlug}/admin`}>企画一覧</Link>
              <Link href={`/${eventSlug}/admin/broadcasts`} className="text-[var(--muted)]">
                連絡
              </Link>
              <Link href={`/${eventSlug}/admin/groups`} className="text-[var(--muted)]">
                団体・予算
              </Link>
              <Link href={`/${eventSlug}/admin/fields`} className="text-[var(--muted)]">
                提出項目
              </Link>
              <Link href={`/${eventSlug}/admin/inventory`} className="text-[var(--muted)]">
                在庫管理
              </Link>
            </nav>
          </div>
          <form action={boundLogout}>
            <button className="text-xs text-[var(--accent-admin-text)] font-semibold">
              ログアウト
            </button>
          </form>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-5 py-8">{children}</div>
    </div>
  );
}

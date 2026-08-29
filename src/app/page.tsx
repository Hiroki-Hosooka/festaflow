import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: events, error } = await supabaseAdmin()
    .from("events")
    .select("slug, name")
    .order("created_at", { ascending: true });

  if (error) throw error;

  if (!events || events.length === 0) {
    return (
      <main className="mx-auto max-w-lg p-10 text-sm leading-relaxed">
        <h1 className="text-lg font-bold mb-3">イベントが未登録です</h1>
        <p className="text-[var(--muted)]">
          Supabase の <code>events</code> テーブルにイベントを登録してください。
          README の手順（<code>supabase/migrations</code> と{" "}
          <code>supabase/seed.sql</code>）を参照してください。
        </p>
      </main>
    );
  }

  if (events.length === 1) {
    redirect(`/${events[0].slug}/login`);
  }

  return (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-lg font-bold mb-6">イベントを選択</h1>
      <ul className="space-y-3">
        {events.map((e) => (
          <li key={e.slug}>
            <Link
              className="text-sm font-semibold text-[var(--accent-group-text)]"
              href={`/${e.slug}/login`}
            >
              {e.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

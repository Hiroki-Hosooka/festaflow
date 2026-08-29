import { requireAdminSession } from "@/lib/session";
import { listGroups } from "@/lib/data/groups";
import { NewGroupForm } from "./NewGroupForm";
import { updateGroupBudgetAction, resetPassphraseAction } from "./actions";

export default async function AdminGroupsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const groups = await listGroups(auth.eventId);

  return (
    <div className="space-y-5 max-w-3xl">
      <h1 className="text-lg font-bold">団体・予算配分</h1>

      <div className="card p-6 space-y-3">
        <div className="text-xs font-bold text-[var(--muted)]">団体を追加</div>
        <NewGroupForm eventSlug={eventSlug} />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_160px] px-4 py-2.5 text-[10.5px] font-bold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
          <span>団体</span>
          <span>配分予算</span>
          <span>合言葉</span>
        </div>
        {groups.length === 0 && (
          <p className="px-4 py-6 text-sm text-[var(--muted)]">まだ団体が登録されていません。</p>
        )}
        {groups.map((group) => {
          const boundBudget = updateGroupBudgetAction.bind(null, eventSlug, group.id);
          const boundReset = resetPassphraseAction.bind(null, eventSlug, group.id);
          return (
            <div
              key={group.id}
              className="grid grid-cols-[1fr_140px_160px] px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0 text-[13px]"
            >
              <span className="font-semibold">{group.name}</span>
              <form action={boundBudget} className="flex items-center gap-1.5">
                <input
                  name="budget"
                  type="number"
                  min={0}
                  defaultValue={group.budget_allocated}
                  aria-label={`${group.name}の配分予算（円）`}
                  className="h-8 w-24 border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
                />
                <span className="text-[11.5px] text-[var(--muted)]">円</span>
                <button className="text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
                  保存
                </button>
              </form>
              <details>
                <summary className="cursor-pointer text-[11.5px] text-[var(--muted)]">
                  合言葉を再設定
                </summary>
                <form action={boundReset} className="flex items-center gap-1.5 mt-2">
                  <input
                    name="passphrase"
                    required
                    placeholder="新しい合言葉"
                    className="h-8 border border-[var(--border-strong)] rounded-md px-2 text-[12px] w-32"
                  />
                  <button className="text-[11.5px] text-[var(--accent-admin-text)] font-semibold">
                    変更
                  </button>
                </form>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

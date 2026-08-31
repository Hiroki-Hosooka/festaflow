import { requireAdminSession } from "@/lib/session";
import { listGroups } from "@/lib/data/groups";
import { NewGroupForm } from "./NewGroupForm";
import { Icon } from "@/components/Icons";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";
import {
  updateGroupBudgetAction,
  resetPassphraseAction,
  resetMemberPassphraseAction,
} from "./actions";
import type { Database } from "@/lib/database.types";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];

export default async function AdminGroupsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const groups = await listGroups(auth.eventId);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "団体・予算配分" }]} />
      <h1 className="page-title">団体・予算配分</h1>

      <div className="card p-6 space-y-3">
        <div className="card-heading">団体を追加</div>
        <NewGroupForm eventSlug={eventSlug} />
      </div>

      <p className="text-[12px] text-[var(--muted)] leading-relaxed bg-[var(--accent-admin-soft-bg)] rounded-lg px-3.5 py-2.5">
        「一般生徒用合言葉」を設定すると、その合言葉でログインした生徒は閲覧とシフト希望の提出のみ行える「一般生徒」として扱われます。未設定の間は一般生徒としてのログインはできません（団体のリーダーは
        <span className="font-semibold">/group/settings</span>
        からも設定できます）。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {groups.length === 0 && (
          <div className="lg:col-span-2 card">
            <EmptyState
              icon="users"
              title="まだ団体が登録されていません"
              description="上のフォームから団体を追加すると、ここに一覧表示されます。"
            />
          </div>
        )}
        {groups.map((group) => (
          <GroupRowCard key={group.id} eventSlug={eventSlug} group={group} />
        ))}
      </div>
    </div>
  );
}

function GroupRowCard({ eventSlug, group }: { eventSlug: string; group: GroupRow }) {
  const boundBudget = updateGroupBudgetAction.bind(null, eventSlug, group.id);
  const boundReset = resetPassphraseAction.bind(null, eventSlug, group.id);
  const boundMemberReset = resetMemberPassphraseAction.bind(null, eventSlug, group.id);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-semibold text-[13.5px]">{group.name}</span>
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
          <button className="btn-row btn-row-admin">保存</button>
        </form>
      </div>

      <div className="flex gap-6 flex-wrap text-[12px]">
        <details>
          <summary className="cursor-pointer text-[var(--muted)] inline-flex items-center gap-1.5">
            <Icon name="key" className="w-3.5 h-3.5 flex-none" />
            リーダー用合言葉を再設定
          </summary>
          <form action={boundReset} className="flex items-center gap-1.5 mt-2">
            <input
              name="passphrase"
              required
              placeholder="新しい合言葉"
              className="h-8 border border-[var(--border-strong)] rounded-md px-2 text-[12px] w-32"
            />
            <button className="btn-row btn-row-admin">変更</button>
          </form>
        </details>

        <details>
          <summary className="cursor-pointer text-[var(--muted)] inline-flex items-center gap-1.5">
            <Icon name="key" className="w-3.5 h-3.5 flex-none" />
            一般生徒用合言葉
            {group.member_passphrase_hash ? (
              <span className="ml-1.5 text-[var(--status-approved-text)] font-semibold">
                設定済み
              </span>
            ) : (
              <span className="ml-1.5 text-[var(--muted-2)]">未設定</span>
            )}
          </summary>
          <form action={boundMemberReset} className="flex items-center gap-1.5 mt-2">
            <input
              name="passphrase"
              placeholder="新しい合言葉（空欄で解除）"
              className="h-8 border border-[var(--border-strong)] rounded-md px-2 text-[12px] w-44"
            />
            <button className="btn-row btn-row-admin">保存</button>
          </form>
        </details>
      </div>
    </div>
  );
}

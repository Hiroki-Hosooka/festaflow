import Link from "next/link";
import { requireAdminSession } from "@/lib/session";
import { listInventoryItems, getInventoryUsage } from "@/lib/data/inventory";
import { NewInventoryItemForm } from "./NewInventoryItemForm";
import { ImportInventoryCsvForm } from "./ImportInventoryCsvForm";
import { DeleteInventoryItemButton } from "./DeleteInventoryItemButton";
import { updateInventoryItemAction } from "./actions";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { EmptyState } from "@/components/EmptyState";

export default async function AdminInventoryPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const [items, usage] = await Promise.all([
    listInventoryItems(auth.eventId),
    getInventoryUsage(auth.eventId),
  ]);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/admin` }, { label: "在庫管理（借用物品）" }]} />
      <div>
        <h1 className="page-title">在庫管理（借用物品）</h1>
        <p className="text-[12.5px] text-[var(--muted)] mt-1 leading-relaxed bg-[var(--accent-admin-soft-bg)] rounded-lg px-3.5 py-2.5">
          ここで登録した物品が、団体側の企画提出フォームで「借用」として選べるようになります。
          在庫は学校全体で共有する1つのプールとして扱い、団体ごとの割当はありません。
          複数団体の希望が競合した場合の割り振り（在庫確保）は、各企画の詳細画面で行います。
        </p>
      </div>

      <div className="card p-6 space-y-3">
        <div className="card-heading">物品を追加</div>
        <NewInventoryItemForm eventSlug={eventSlug} />
      </div>

      <div className="card p-6 space-y-3">
        <div className="card-heading">スプレッドシート連携（CSV）</div>
        <p className="text-[11.5px] text-[var(--muted)] leading-relaxed">
          在庫一覧をCSVでダウンロードしてGoogleスプレッドシート等に貼り付けて編集し、編集後のCSVをここからアップロードするとアプリ側の在庫数に反映されます。物品名が一致する行は更新、一致しない行は新規追加されます（既存の未掲載物品は削除されません）。
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={`/${eventSlug}/admin/inventory/export`}
            className="h-9 px-4 rounded-md text-[12.5px] font-semibold border border-[var(--border-strong)] inline-flex items-center"
          >
            CSVをダウンロード
          </a>
        </div>
        <ImportInventoryCsvForm eventSlug={eventSlug} />
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_90px_1fr_90px] px-4 py-2.5 text-[10.5px] font-bold text-[var(--muted)] bg-[var(--background)] border-b border-[var(--border)]">
          <span>物品</span>
          <span>在庫総数</span>
          <span>確保済み</span>
          <span>要求中</span>
          <span>備考</span>
          <span />
        </div>
        {items.length === 0 && (
          <EmptyState
            icon="package"
            title="まだ在庫物品が登録されていません"
            description="上のフォームから物品を追加すると、団体側の「借用」選択肢に反映されます。"
          />
        )}
        {items.map((item) => {
          const stats = usage.get(item.id);
          const boundUpdate = updateInventoryItemAction.bind(null, eventSlug, item.id);
          return (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_90px_90px_90px_1fr_90px] px-4 py-3 items-center border-b border-[var(--border)] last:border-b-0 text-[13px] gap-2"
            >
              <span className="font-semibold">{item.name}</span>
              <form action={boundUpdate} className="flex items-center gap-1">
                <input type="hidden" name="notes" value={item.notes} />
                <input
                  name="total_quantity"
                  type="number"
                  min={0}
                  defaultValue={item.total_quantity}
                  aria-label={`${item.name}の在庫総数`}
                  className="h-8 w-16 border border-[var(--border-strong)] rounded-md px-2 text-[12.5px]"
                />
                <button className="btn-row btn-row-admin">保存</button>
              </form>
              <span className="text-[12.5px] text-[var(--muted)]">
                {stats?.securedTotal ?? 0}
              </span>
              <span
                className={
                  stats && stats.requestedTotal > item.total_quantity
                    ? "text-[12.5px] text-[var(--danger-text)] font-semibold"
                    : "text-[12.5px] text-[var(--muted)]"
                }
              >
                {stats?.requestedTotal ?? 0}
              </span>
              <span className="text-[12px] text-[var(--muted)] truncate">
                {item.notes || "—"}
              </span>
              <DeleteInventoryItemButton eventSlug={eventSlug} inventoryItemId={item.id} />
            </div>
          );
        })}
      </div>

      {Array.from(usage.values()).some((u) => u.requests.length > 0) && (
        <div className="card p-6 space-y-4">
          <div className="card-heading">物品ごとの借用希望</div>
          {Array.from(usage.values())
            .filter((u) => u.requests.length > 0)
            .map((u) => {
              const item = items.find((i) => i.id === u.inventoryItemId);
              return (
                <div key={u.inventoryItemId}>
                  <div className="text-[13px] font-semibold mb-1.5">
                    {item?.name ?? "（削除済みの物品）"}
                    <span className="text-[11.5px] text-[var(--muted)] font-normal ml-2">
                      在庫 {item?.total_quantity ?? 0} / 確保済み {u.securedTotal} / 要求中{" "}
                      {u.requestedTotal}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {u.requests.map((req) => (
                      <div
                        key={req.submissionItemId}
                        className="flex items-center justify-between text-[12.5px] px-2.5 py-1.5 bg-[var(--background)] rounded-md"
                      >
                        <span>
                          {req.groupName} — {req.quantity}個希望
                          {req.stockStatus === "secured" && `（${req.securedQuantity}個確保）`}
                        </span>
                        <Link
                          href={`/${eventSlug}/admin/submissions/${req.submissionId}`}
                          className="text-[var(--accent-admin-text)] font-semibold"
                        >
                          企画で調整
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

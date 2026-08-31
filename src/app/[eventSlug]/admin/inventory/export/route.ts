import { requireAdminSession } from "@/lib/session";
import { listInventoryItems } from "@/lib/data/inventory";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;
  const auth = await requireAdminSession(eventSlug);
  const items = await listInventoryItems(auth.eventId);

  const rows = [
    ["物品名", "在庫総数", "備考"],
    ...items.map((i) => [i.name, String(i.total_quantity), i.notes]),
  ];

  return csvResponse(toCsv(rows), "inventory.csv");
}

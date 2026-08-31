import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import {
  getShiftConfig,
  listShiftAssignments,
  listShiftMembers,
  generateSlots,
} from "@/lib/data/shifts";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventSlug: string }> }
) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);

  const [config, assignments, members] = await Promise.all([
    getShiftConfig(submission.id),
    listShiftAssignments(submission.id),
    listShiftMembers(submission.id),
  ]);

  if (!config) {
    return new Response("先にシフト設定（活動時間・コマ時間）を保存してください。", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const memberNameById = new Map(members.map((m) => [m.id, m.name]));
  const slots = generateSlots(config.start_time, config.end_time, config.slot_minutes);

  const namesBySlot = new Map<string, string[]>();
  for (const a of assignments) {
    const arr = namesBySlot.get(a.slot_label) ?? [];
    arr.push(memberNameById.get(a.member_id) ?? "");
    namesBySlot.set(a.slot_label, arr);
  }

  const capacity = Math.max(
    config.people_per_slot,
    ...Array.from(namesBySlot.values()).map((v) => v.length),
    1
  );
  const header = ["スロット", ...Array.from({ length: capacity }, (_, i) => `担当者${i + 1}`)];
  const rows = [
    header,
    ...slots.map((slot) => {
      const names = namesBySlot.get(slot) ?? [];
      return [slot, ...Array.from({ length: capacity }, (_, i) => names[i] ?? "")];
    }),
  ];

  return csvResponse(toCsv(rows), "shifts.csv");
}

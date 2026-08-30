import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import {
  getShiftConfig,
  listShiftMembers,
  listShiftPreferences,
  listShiftAssignments,
  generateSlots,
} from "@/lib/data/shifts";
import { ShiftBoard } from "./ShiftBoard";

export default async function GroupShiftsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const [config, members, preferences, assignments] = await Promise.all([
    getShiftConfig(submission.id),
    listShiftMembers(submission.id),
    listShiftPreferences(submission.id),
    listShiftAssignments(submission.id),
  ]);

  const slots = config
    ? generateSlots(config.start_time, config.end_time, config.slot_minutes)
    : [];

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold print:hidden">当番シフト配置</h1>
      <ShiftBoard
        eventSlug={eventSlug}
        config={config}
        members={members}
        preferences={preferences}
        assignments={assignments}
        slots={slots}
        canEdit={auth.role === "leader"}
      />
    </div>
  );
}

import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission, getSubmissionDetail } from "@/lib/data/submissions";
import { listInventoryItems, getInventoryUsage } from "@/lib/data/inventory";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { listAttachments } from "@/lib/data/attachments";
import { SubmissionForm } from "./SubmissionForm";
import { AttachmentsCard } from "./AttachmentsCard";

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const detail = await getSubmissionDetail(submission.id);

  if (!detail || !detail.group) {
    throw new Error("企画データの取得に失敗しました。");
  }

  const inventoryItems = await listInventoryItems(auth.eventId);
  const usage = await getInventoryUsage(auth.eventId);
  const schedules = await listSubmissionSchedules(auth.eventId);
  const attachments = await listAttachments(submission.id);
  const inventoryAvailability = Object.fromEntries(
    Array.from(usage.entries()).map(([id, u]) => [
      id,
      { available: u.available, requestedTotal: u.requestedTotal },
    ])
  );

  return (
    <div className="space-y-5">
      <SubmissionForm
        eventSlug={eventSlug}
        groupName={auth.groupName}
        submission={detail.submission}
        items={detail.items}
        fieldValues={detail.fieldValues}
        fields={detail.fields}
        budgetAllocated={detail.group.budget_allocated}
        inventoryItems={inventoryItems}
        inventoryAvailability={inventoryAvailability}
        schedules={schedules}
        role={auth.role}
      />
      <AttachmentsCard
        eventSlug={eventSlug}
        attachments={attachments}
        canEdit={auth.role === "leader"}
      />
    </div>
  );
}

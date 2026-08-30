import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission, getSubmissionDetail } from "@/lib/data/submissions";
import { listInventoryItems, getInventoryUsage } from "@/lib/data/inventory";
import { listSubmissionSchedules } from "@/lib/data/submissionSchedules";
import { listAttachments } from "@/lib/data/attachments";
import { listAllClassificationOptions } from "@/lib/data/classificationOptions";
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

  const [detail, inventoryItems, usage, schedules, attachments, classificationOptions] =
    await Promise.all([
      getSubmissionDetail(submission.id),
      listInventoryItems(auth.eventId),
      getInventoryUsage(auth.eventId),
      listSubmissionSchedules(auth.eventId),
      listAttachments(submission.id),
      listAllClassificationOptions(auth.eventId),
    ]);
  const { affiliation, area } = classificationOptions;

  if (!detail || !detail.group) {
    throw new Error("企画データの取得に失敗しました。");
  }
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
        affiliationOptions={affiliation.map((o) => o.value)}
        areaOptions={area.map((o) => o.value)}
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

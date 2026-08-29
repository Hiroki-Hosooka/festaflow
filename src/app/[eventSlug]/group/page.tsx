import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission, getSubmissionDetail } from "@/lib/data/submissions";
import { listInventoryItems } from "@/lib/data/inventory";
import { SubmissionForm } from "./SubmissionForm";

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

  return (
    <SubmissionForm
      eventSlug={eventSlug}
      groupName={auth.groupName}
      submission={detail.submission}
      items={detail.items}
      fieldValues={detail.fieldValues}
      fields={detail.fields}
      budgetAllocated={detail.group.budget_allocated}
      inventoryItems={inventoryItems}
    />
  );
}

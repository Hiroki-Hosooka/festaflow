import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { listUnreadSubmissionIds } from "@/lib/data/comments";
import type { Affiliation, Area, ItemKind, SubmissionStatus } from "@/lib/database.types";

export interface SubmissionListRow {
  groupId: string;
  groupName: string;
  budgetAllocated: number;
  submissionId: string | null;
  status: SubmissionStatus | null;
  name: string;
  plannedTotal: number;
  hasUnreadFromGroup: boolean;
  affiliation: Affiliation | null;
  area: Area | null;
  hasShiftConfig: boolean;
}

export async function listSubmissionsForAdmin(
  eventId: string
): Promise<SubmissionListRow[]> {
  const db = supabaseAdmin();

  const { data: groups, error: gErr } = await db
    .from("groups")
    .select("*")
    .eq("event_id", eventId)
    .order("name", { ascending: true });
  if (gErr) throw gErr;

  const { data: submissions, error: sErr } = await db
    .from("submissions")
    .select("*")
    .eq("event_id", eventId);
  if (sErr) throw sErr;

  const submissionIds = (submissions ?? []).map((s) => s.id);
  let items: { submission_id: string; quantity: number; unit_price: number }[] = [];
  if (submissionIds.length > 0) {
    const { data, error } = await db
      .from("submission_items")
      .select("submission_id, quantity, unit_price")
      .in("submission_id", submissionIds);
    if (error) throw error;
    items = data ?? [];
  }

  const totalsBySubmission = new Map<string, number>();
  for (const item of items) {
    totalsBySubmission.set(
      item.submission_id,
      (totalsBySubmission.get(item.submission_id) ?? 0) + item.quantity * item.unit_price
    );
  }

  const submissionsByGroup = new Map((submissions ?? []).map((s) => [s.group_id, s]));
  const unreadIds = await listUnreadSubmissionIds(submissionIds, "admin");

  let shiftConfiguredIds = new Set<string>();
  if (submissionIds.length > 0) {
    const { data, error } = await db
      .from("shift_configs")
      .select("submission_id")
      .in("submission_id", submissionIds);
    if (error) throw error;
    shiftConfiguredIds = new Set((data ?? []).map((c) => c.submission_id));
  }

  return (groups ?? []).map((group) => {
    const submission = submissionsByGroup.get(group.id) ?? null;
    return {
      groupId: group.id,
      groupName: group.name,
      budgetAllocated: group.budget_allocated,
      submissionId: submission?.id ?? null,
      status: submission?.status ?? null,
      name: submission?.name ?? "",
      plannedTotal: submission ? totalsBySubmission.get(submission.id) ?? 0 : 0,
      hasUnreadFromGroup: submission ? unreadIds.has(submission.id) : false,
      affiliation: submission?.affiliation ?? null,
      area: submission?.area ?? null,
      hasShiftConfig: submission ? shiftConfiguredIds.has(submission.id) : false,
    };
  });
}

export async function getOrCreateSubmission(eventId: string, groupId: string) {
  const db = supabaseAdmin();
  const { data: existing, error } = await db
    .from("submissions")
    .select("*")
    .eq("event_id", eventId)
    .eq("group_id", groupId)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing;

  const { data: created, error: insertError } = await db
    .from("submissions")
    .insert({ event_id: eventId, group_id: groupId })
    .select("*")
    .single();
  if (insertError) {
    // layout.tsx と page.tsx が同時に初回アクセスすると二重にinsertが走りうるため、
    // ユニーク制約違反(23505)の場合は競合相手が作った行を取り直す。
    if (insertError.code === "23505") {
      const { data: retried, error: retryError } = await db
        .from("submissions")
        .select("*")
        .eq("event_id", eventId)
        .eq("group_id", groupId)
        .single();
      if (retryError) throw retryError;
      return retried;
    }
    throw insertError;
  }
  return created;
}

export async function getSubmissionDetail(submissionId: string) {
  const db = supabaseAdmin();
  const { data: submission, error } = await db
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw error;
  if (!submission) return null;

  const [groupRes, itemsRes, valuesRes, fieldsRes] = await Promise.all([
    db.from("groups").select("*").eq("id", submission.group_id).maybeSingle(),
    db
      .from("submission_items")
      .select("*")
      .eq("submission_id", submissionId)
      .order("sort_order", { ascending: true }),
    db.from("submission_field_values").select("*").eq("submission_id", submissionId),
    db
      .from("form_fields")
      .select("*")
      .eq("event_id", submission.event_id)
      .order("sort_order", { ascending: true }),
  ]);

  if (groupRes.error) throw groupRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (valuesRes.error) throw valuesRes.error;
  if (fieldsRes.error) throw fieldsRes.error;

  return {
    submission,
    group: groupRes.data,
    items: itemsRes.data ?? [],
    fieldValues: valuesRes.data ?? [],
    fields: fieldsRes.data ?? [],
  };
}

export async function replaceSubmissionItems(
  submissionId: string,
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    kind: ItemKind;
    inventoryItemId: string | null;
  }[]
) {
  const db = supabaseAdmin();
  const { error: delErr } = await db
    .from("submission_items")
    .delete()
    .eq("submission_id", submissionId);
  if (delErr) throw delErr;
  if (items.length === 0) return;

  const { error: insErr } = await db.from("submission_items").insert(
    items.map((item, index) => ({
      submission_id: submissionId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sort_order: index,
      kind: item.kind,
      inventory_item_id: item.inventoryItemId,
    }))
  );
  if (insErr) throw insErr;
}

export async function replaceFieldValues(
  submissionId: string,
  values: Record<string, string>
) {
  const db = supabaseAdmin();
  const entries = Object.entries(values);
  const { error: delErr } = await db
    .from("submission_field_values")
    .delete()
    .eq("submission_id", submissionId);
  if (delErr) throw delErr;
  if (entries.length === 0) return;

  const { error: insErr } = await db.from("submission_field_values").insert(
    entries.map(([fieldId, value]) => ({
      submission_id: submissionId,
      field_id: fieldId,
      value,
    }))
  );
  if (insErr) throw insErr;
}

export async function updateSubmissionCore(
  submissionId: string,
  core: {
    name: string;
    content: string;
    location: string;
    affiliation: Affiliation | null;
    area: Area | null;
  }
) {
  const { error } = await supabaseAdmin()
    .from("submissions")
    .update({ ...core, updated_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function markSubmitted(submissionId: string) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin()
    .from("submissions")
    .update({ status: "submitted", submitted_at: now, updated_at: now, admin_comment: "" })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function decideSubmission(
  submissionId: string,
  decision: Extract<SubmissionStatus, "approved" | "rejected" | "returned">,
  adminComment: string
) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin()
    .from("submissions")
    .update({
      status: decision,
      admin_comment: adminComment,
      decided_at: now,
      updated_at: now,
    })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function listBorrowStockStatuses(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_items")
    .select("name, stock_status")
    .eq("submission_id", submissionId)
    .eq("kind", "borrow");
  if (error) throw error;
  return data ?? [];
}

export function sumItems(items: { quantity: number; unit_price: number }[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

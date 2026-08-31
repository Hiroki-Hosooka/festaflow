import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export async function listSubmissionSchedules(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_schedules")
    .select("*")
    .eq("event_id", eventId)
    .order("deadline", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSubmissionSchedulesForGroup(eventId: string, groupId: string) {
  const all = await listSubmissionSchedules(eventId);
  return all.filter((s) => !s.target_group_ids || s.target_group_ids.includes(groupId));
}

export async function createSubmissionSchedule(params: {
  eventId: string;
  title: string;
  deadline: string;
  hint: string;
  targetGroupIds: string[] | null;
}) {
  const { error } = await supabaseAdmin().from("submission_schedules").insert({
    event_id: params.eventId,
    title: params.title,
    deadline: params.deadline,
    hint: params.hint,
    target_group_ids: params.targetGroupIds,
  });
  if (error) throw error;
}

export async function deleteSubmissionSchedule(scheduleId: string) {
  const { error } = await supabaseAdmin()
    .from("submission_schedules")
    .delete()
    .eq("id", scheduleId);
  if (error) throw error;
}

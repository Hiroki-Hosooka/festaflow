import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

export async function hasReminderBeenSent(scheduleId: string, threshold: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("schedule_reminders_sent")
    .select("id")
    .eq("schedule_id", scheduleId)
    .eq("threshold", threshold)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function markReminderSent(scheduleId: string, threshold: string) {
  const { error } = await supabaseAdmin()
    .from("schedule_reminders_sent")
    .insert({ schedule_id: scheduleId, threshold });
  // ユニーク制約違反(23505)は他プロセスが同時に送信済みマークを付けた場合なので無視してよい
  if (error && error.code !== "23505") throw error;
}

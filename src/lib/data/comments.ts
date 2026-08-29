import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { CommentSender } from "@/lib/database.types";

export async function listComments(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_comments")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addComment(
  submissionId: string,
  senderType: CommentSender,
  body: string
) {
  const { error } = await supabaseAdmin()
    .from("submission_comments")
    .insert({ submission_id: submissionId, sender_type: senderType, body });
  if (error) throw error;
}

// viewerType 側が閲覧した際、相手が送った未読メッセージを既読にする
export async function markCommentsRead(submissionId: string, viewerType: CommentSender) {
  const otherSender: CommentSender = viewerType === "admin" ? "group" : "admin";
  const { error } = await supabaseAdmin()
    .from("submission_comments")
    .update({ read_at: new Date().toISOString() })
    .eq("submission_id", submissionId)
    .eq("sender_type", otherSender)
    .is("read_at", null);
  if (error) throw error;
}

// viewerType 側から見て、相手からの未読メッセージがある submission_id の集合を返す
export async function listUnreadSubmissionIds(
  submissionIds: string[],
  viewerType: CommentSender
) {
  if (submissionIds.length === 0) return new Set<string>();
  const otherSender: CommentSender = viewerType === "admin" ? "group" : "admin";
  const { data, error } = await supabaseAdmin()
    .from("submission_comments")
    .select("submission_id")
    .in("submission_id", submissionIds)
    .eq("sender_type", otherSender)
    .is("read_at", null);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.submission_id));
}

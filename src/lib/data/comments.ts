import "server-only";
import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import type { CommentSender } from "@/lib/database.types";

export interface InboxThread {
  submissionId: string;
  groupId: string;
  groupName: string;
  submissionName: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSender: CommentSender;
  hasUnreadFromGroup: boolean;
}

// 全団体の個別コメントを横断的に新着順で並べる（実行委員会が直前の問い合わせを取りこぼさないための受信箱）
// cache() で同一リクエスト内の重複呼び出し（layout + hub ページなど）を1回のクエリに統合する
export const listInboxThreads = cache(async function listInboxThreads(
  eventId: string
): Promise<InboxThread[]> {
  const db = supabaseAdmin();

  const { data: submissions, error: subErr } = await db
    .from("submissions")
    .select("id, group_id, name")
    .eq("event_id", eventId);
  if (subErr) throw subErr;
  const submissionIds = (submissions ?? []).map((s) => s.id);
  if (submissionIds.length === 0) return [];

  const { data: groups, error: grpErr } = await db
    .from("groups")
    .select("id, name")
    .eq("event_id", eventId);
  if (grpErr) throw grpErr;
  const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));

  const { data: comments, error: cErr } = await db
    .from("submission_comments")
    .select("*")
    .in("submission_id", submissionIds)
    .order("created_at", { ascending: false });
  if (cErr) throw cErr;

  const bySubmission = new Map<string, NonNullable<typeof comments>>();
  for (const c of comments ?? []) {
    const arr = bySubmission.get(c.submission_id);
    if (arr) arr.push(c);
    else bySubmission.set(c.submission_id, [c]);
  }

  const threads: InboxThread[] = [];
  for (const s of submissions ?? []) {
    const list = bySubmission.get(s.id);
    if (!list || list.length === 0) continue;
    const last = list[0];
    const hasUnread = list.some((c) => c.sender_type === "group" && !c.read_at);
    threads.push({
      submissionId: s.id,
      groupId: s.group_id,
      groupName: groupNameById.get(s.group_id) ?? "不明な団体",
      submissionName: s.name,
      lastMessage: last.body,
      lastMessageAt: last.created_at,
      lastSender: last.sender_type,
      hasUnreadFromGroup: hasUnread,
    });
  }

  threads.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1));
  return threads;
});

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

// 単一 submission の未読有無。cache() は配列引数だと参照が変わるたびキャッシュミスするため、
// layout + hub ページなど同一リクエスト内で重複しやすいこの1件版を別途用意する。
export const hasUnreadForSubmission = cache(async function hasUnreadForSubmission(
  submissionId: string,
  viewerType: CommentSender
): Promise<boolean> {
  const ids = await listUnreadSubmissionIds([submissionId], viewerType);
  return ids.has(submissionId);
});

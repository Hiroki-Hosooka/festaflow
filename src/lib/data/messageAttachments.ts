import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";

export async function listMessageAttachmentsByCommentIds(commentIds: string[]) {
  if (commentIds.length === 0) return new Map<string, { id: string; file_name: string; storage_path: string }[]>();
  const { data, error } = await supabaseAdmin()
    .from("message_attachments")
    .select("*")
    .in("comment_id", commentIds)
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  const map = new Map<string, NonNullable<typeof data>>();
  for (const row of data ?? []) {
    if (!row.comment_id) continue;
    const arr = map.get(row.comment_id);
    if (arr) arr.push(row);
    else map.set(row.comment_id, [row]);
  }
  return map;
}

export async function listMessageAttachmentsByBroadcastIds(broadcastIds: string[]) {
  if (broadcastIds.length === 0)
    return new Map<string, { id: string; file_name: string; storage_path: string }[]>();
  const { data, error } = await supabaseAdmin()
    .from("message_attachments")
    .select("*")
    .in("broadcast_id", broadcastIds)
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  const map = new Map<string, NonNullable<typeof data>>();
  for (const row of data ?? []) {
    if (!row.broadcast_id) continue;
    const arr = map.get(row.broadcast_id);
    if (arr) arr.push(row);
    else map.set(row.broadcast_id, [row]);
  }
  return map;
}

async function uploadOne(prefix: string, file: File): Promise<{ file_name: string; storage_path: string }> {
  const storagePath = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
  await uploadFile(storagePath, file);
  return { file_name: file.name, storage_path: storagePath };
}

export async function addCommentAttachments(commentId: string, files: File[]) {
  if (files.length === 0) return;
  const uploaded = await Promise.all(files.map((f) => uploadOne(`message-attachments/comments/${commentId}`, f)));
  const { error } = await supabaseAdmin()
    .from("message_attachments")
    .insert(uploaded.map((u) => ({ parent_kind: "comment" as const, comment_id: commentId, ...u })));
  if (error) throw error;
}

export async function addBroadcastAttachments(broadcastId: string, files: File[]) {
  if (files.length === 0) return;
  const uploaded = await Promise.all(
    files.map((f) => uploadOne(`message-attachments/broadcasts/${broadcastId}`, f))
  );
  const { error } = await supabaseAdmin()
    .from("message_attachments")
    .insert(uploaded.map((u) => ({ parent_kind: "broadcast" as const, broadcast_id: broadcastId, ...u })));
  if (error) throw error;
}

import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadFile, removeFile } from "@/lib/storage";
import type { CommentSender, ReviewStatus } from "@/lib/database.types";

export async function listAttachments(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_attachments")
    .select("*")
    .eq("submission_id", submissionId)
    .order("uploaded_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addAttachment(submissionId: string, file: File) {
  const storagePath = `attachments/${submissionId}/${Date.now()}-${file.name}`;
  await uploadFile(storagePath, file);

  const { error } = await supabaseAdmin().from("submission_attachments").insert({
    submission_id: submissionId,
    file_name: file.name,
    storage_path: storagePath,
  });
  if (error) throw error;
}

export async function getAttachment(attachmentId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_attachments")
    .select("*")
    .eq("id", attachmentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteAttachment(attachmentId: string) {
  const attachment = await getAttachment(attachmentId);
  if (!attachment) return;
  await removeFile(attachment.storage_path);
  const { error } = await supabaseAdmin()
    .from("submission_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) throw error;
}

export async function reviewAttachment(
  attachmentId: string,
  params: { reviewStatus: ReviewStatus }
) {
  const { error } = await supabaseAdmin()
    .from("submission_attachments")
    .update({ review_status: params.reviewStatus })
    .eq("id", attachmentId);
  if (error) throw error;
}

export async function listAttachmentComments(attachmentId: string) {
  const { data, error } = await supabaseAdmin()
    .from("submission_attachment_comments")
    .select("*")
    .eq("attachment_id", attachmentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listAttachmentCommentsByIds(attachmentIds: string[]) {
  if (attachmentIds.length === 0) return new Map<string, Awaited<ReturnType<typeof listAttachmentComments>>>();
  const { data, error } = await supabaseAdmin()
    .from("submission_attachment_comments")
    .select("*")
    .in("attachment_id", attachmentIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const map = new Map<string, NonNullable<typeof data>>();
  for (const row of data ?? []) {
    const arr = map.get(row.attachment_id);
    if (arr) arr.push(row);
    else map.set(row.attachment_id, [row]);
  }
  return map;
}

export async function addAttachmentComment(
  attachmentId: string,
  senderType: CommentSender,
  body: string
) {
  const { error } = await supabaseAdmin()
    .from("submission_attachment_comments")
    .insert({ attachment_id: attachmentId, sender_type: senderType, body });
  if (error) throw error;
}

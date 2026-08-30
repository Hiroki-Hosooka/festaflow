import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadFile, removeFile } from "@/lib/storage";
import type { ReviewStatus } from "@/lib/database.types";

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
  params: { reviewStatus: ReviewStatus; reviewComment: string }
) {
  const { error } = await supabaseAdmin()
    .from("submission_attachments")
    .update({ review_status: params.reviewStatus, review_comment: params.reviewComment })
    .eq("id", attachmentId);
  if (error) throw error;
}

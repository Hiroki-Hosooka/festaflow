import "server-only";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "festaflow-files";

export async function uploadFile(path: string, file: File): Promise<void> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw error;
}

export async function removeFile(path: string): Promise<void> {
  const { error } = await supabaseAdmin().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function createSignedUrl(path: string, expiresInSeconds = 60 * 10): Promise<string> {
  const { data, error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

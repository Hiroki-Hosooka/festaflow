import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import { uploadFile, removeFile } from "@/lib/storage";

export async function listEventDocuments(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("event_documents")
    .select("*")
    .eq("event_id", eventId)
    .order("uploaded_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addEventDocument(eventId: string, file: File) {
  const storagePath = `documents/${eventId}/${Date.now()}-${file.name}`;
  await uploadFile(storagePath, file);

  const { error } = await supabaseAdmin().from("event_documents").insert({
    event_id: eventId,
    file_name: file.name,
    storage_path: storagePath,
  });
  if (error) throw error;
}

export async function getEventDocument(documentId: string) {
  const { data, error } = await supabaseAdmin()
    .from("event_documents")
    .select("*")
    .eq("id", documentId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteEventDocument(documentId: string) {
  const doc = await getEventDocument(documentId);
  if (!doc) return;
  await removeFile(doc.storage_path);
  const { error } = await supabaseAdmin().from("event_documents").delete().eq("id", documentId);
  if (error) throw error;
}

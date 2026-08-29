import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { FormFieldType } from "@/lib/database.types";

export async function listFormFields(eventId: string) {
  const { data, error } = await supabaseAdmin()
    .from("form_fields")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createFormField(params: {
  eventId: string;
  key: string;
  label: string;
  fieldType: FormFieldType;
  required: boolean;
  sortOrder: number;
}) {
  const { error } = await supabaseAdmin().from("form_fields").insert({
    event_id: params.eventId,
    key: params.key,
    label: params.label,
    field_type: params.fieldType,
    required: params.required,
    sort_order: params.sortOrder,
  });

  if (error) throw error;
}

export async function updateFormField(
  fieldId: string,
  params: { label: string; required: boolean }
) {
  const { error } = await supabaseAdmin()
    .from("form_fields")
    .update({ label: params.label, required: params.required })
    .eq("id", fieldId);

  if (error) throw error;
}

export async function deleteFormField(fieldId: string) {
  const { error } = await supabaseAdmin().from("form_fields").delete().eq("id", fieldId);
  if (error) throw error;
}

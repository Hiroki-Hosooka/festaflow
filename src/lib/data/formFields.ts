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
  applicableGenres: string[] | null;
}) {
  const { error } = await supabaseAdmin().from("form_fields").insert({
    event_id: params.eventId,
    key: params.key,
    label: params.label,
    field_type: params.fieldType,
    required: params.required,
    sort_order: params.sortOrder,
    applicable_genres: params.applicableGenres,
  });

  if (error) throw error;
}

export async function updateFormField(
  fieldId: string,
  params: { label: string; required: boolean; applicableGenres: string[] | null }
) {
  const { error } = await supabaseAdmin()
    .from("form_fields")
    .update({
      label: params.label,
      required: params.required,
      applicable_genres: params.applicableGenres,
    })
    .eq("id", fieldId);

  if (error) throw error;
}

export function isFieldApplicable(field: { applicable_genres: string[] | null }, genre: string | null) {
  if (!field.applicable_genres || field.applicable_genres.length === 0) return true;
  return !!genre && field.applicable_genres.includes(genre);
}

export async function deleteFormField(fieldId: string) {
  const { error } = await supabaseAdmin().from("form_fields").delete().eq("id", fieldId);
  if (error) throw error;
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createBroadcast } from "@/lib/data/broadcasts";
import type { BroadcastTarget } from "@/lib/database.types";

export async function sendBroadcastAction(eventSlug: string, formData: FormData) {
  const auth = await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  const targetType = String(formData.get("target_type") ?? "all") as BroadcastTarget;
  if (!body) return;

  await createBroadcast(auth.eventId, targetType === "unsubmitted" ? "unsubmitted" : "all", body);
  revalidatePath(`/${eventSlug}/admin/broadcasts`);
}

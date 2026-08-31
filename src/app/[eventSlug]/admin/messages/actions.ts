"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createBroadcast } from "@/lib/data/broadcasts";
import type { BroadcastTarget } from "@/lib/database.types";

export async function sendBroadcastAction(eventSlug: string, formData: FormData) {
  const auth = await requireAdminSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  const targetTypeRaw = String(formData.get("target_type") ?? "all") as BroadcastTarget;
  const targetType: BroadcastTarget =
    targetTypeRaw === "unsubmitted" || targetTypeRaw === "custom" ? targetTypeRaw : "all";
  if (!body) return;

  const groupIds =
    targetType === "custom" ? formData.getAll("group_ids").map(String).filter(Boolean) : null;
  if (targetType === "custom" && (!groupIds || groupIds.length === 0)) return;

  await createBroadcast(auth.eventId, targetType, body, groupIds);
  revalidatePath(`/${eventSlug}/admin/messages`);
}

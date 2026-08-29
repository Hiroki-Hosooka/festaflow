"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { updateEventDeadline } from "@/lib/data/events";
import { parseJstDatetimeLocal } from "@/lib/format";

export async function updateDeadlineAction(eventSlug: string, formData: FormData) {
  const auth = await requireAdminSession(eventSlug);

  const raw = String(formData.get("deadline") ?? "").trim();
  const deadline = raw ? parseJstDatetimeLocal(raw) : null;

  await updateEventDeadline(auth.eventId, deadline);

  revalidatePath(`/${eventSlug}/admin`);
  revalidatePath(`/${eventSlug}/group`);
}

export async function clearDeadlineAction(eventSlug: string) {
  const auth = await requireAdminSession(eventSlug);
  await updateEventDeadline(auth.eventId, null);

  revalidatePath(`/${eventSlug}/admin`);
  revalidatePath(`/${eventSlug}/group`);
}

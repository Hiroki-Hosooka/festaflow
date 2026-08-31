"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { createAdminCalendarEvent, deleteCalendarEvent } from "@/lib/data/calendarEvents";

export interface CalendarEventFormState {
  error?: string;
  success?: string;
}

export async function createAdminCalendarEventAction(
  eventSlug: string,
  _prevState: CalendarEventFormState,
  formData: FormData
): Promise<CalendarEventFormState> {
  const auth = await requireAdminSession(eventSlug);
  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const color = String(formData.get("color") ?? "#2563eb").trim();

  if (!title || !eventDate) {
    return { error: "予定の名前と日付を入力してください。" };
  }

  await createAdminCalendarEvent({ eventId: auth.eventId, title, eventDate, color });
  revalidatePath(`/${eventSlug}/admin`);
  return { success: `「${title}」を追加しました。` };
}

export async function deleteAdminCalendarEventAction(eventSlug: string, id: string) {
  await requireAdminSession(eventSlug);
  await deleteCalendarEvent(id);
  revalidatePath(`/${eventSlug}/admin`);
}

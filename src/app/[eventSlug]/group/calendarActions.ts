"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { createGroupCalendarEvent, deleteCalendarEvent, getCalendarEvent } from "@/lib/data/calendarEvents";

export interface CalendarEventFormState {
  error?: string;
  success?: string;
}

export async function createGroupCalendarEventAction(
  eventSlug: string,
  _prevState: CalendarEventFormState,
  formData: FormData
): Promise<CalendarEventFormState> {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") {
    return { error: "この操作はクラスリーダーのみ行えます。" };
  }
  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const color = String(formData.get("color") ?? "#2563eb").trim();

  if (!title || !eventDate) {
    return { error: "予定の名前と日付を入力してください。" };
  }

  await createGroupCalendarEvent({
    eventId: auth.eventId,
    groupId: auth.groupId,
    title,
    eventDate,
    color,
  });
  revalidatePath(`/${eventSlug}/group`);
  return { success: `「${title}」を追加しました。` };
}

export async function deleteGroupCalendarEventAction(eventSlug: string, id: string) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") return;

  const existing = await getCalendarEvent(id);
  if (!existing || existing.owner_kind !== "group" || existing.owner_group_id !== auth.groupId) {
    return;
  }
  await deleteCalendarEvent(id);
  revalidatePath(`/${eventSlug}/group`);
}

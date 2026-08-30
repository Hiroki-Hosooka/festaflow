"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import {
  createSubmissionSchedule,
  deleteSubmissionSchedule,
} from "@/lib/data/submissionSchedules";
import { parseJstDatetimeLocal } from "@/lib/format";

export interface ScheduleFormState {
  error?: string;
  success?: string;
}

export async function createScheduleAction(
  eventSlug: string,
  _prevState: ScheduleFormState,
  formData: FormData
): Promise<ScheduleFormState> {
  const auth = await requireAdminSession(eventSlug);

  const title = String(formData.get("title") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const hint = String(formData.get("hint") ?? "").trim();

  if (!title || !deadlineRaw) {
    return { error: "提出物の名前と締切日時を入力してください。" };
  }

  await createSubmissionSchedule({
    eventId: auth.eventId,
    title,
    deadline: parseJstDatetimeLocal(deadlineRaw),
    hint,
  });

  revalidatePath(`/${eventSlug}/admin`);
  revalidatePath(`/${eventSlug}/group`);
  return { success: `「${title}」を登録しました。` };
}

export async function deleteScheduleAction(eventSlug: string, scheduleId: string) {
  await requireAdminSession(eventSlug);
  await deleteSubmissionSchedule(scheduleId);
  revalidatePath(`/${eventSlug}/admin`);
  revalidatePath(`/${eventSlug}/group`);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { addComment } from "@/lib/data/comments";

export async function sendGroupCommentAction(eventSlug: string, formData: FormData) {
  const auth = await requireGroupSession(eventSlug);
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await addComment(submission.id, "group", body);
  revalidatePath(`/${eventSlug}/group/messages`);
}

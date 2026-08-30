"use server";

import { revalidatePath } from "next/cache";
import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import {
  createTodoGroup,
  renameTodoGroup,
  deleteTodoGroup,
  createTodoTask,
  createTasksFromTemplate,
  updateTodoTaskStatus,
  deleteTodoTask,
} from "@/lib/data/todos";
import type { TodoStatus } from "@/lib/database.types";

async function requireLeader(eventSlug: string) {
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") throw new Error("この操作はクラスリーダーのみ行えます。");
  return auth;
}

export async function createTodoGroupAction(eventSlug: string, formData: FormData) {
  const auth = await requireLeader(eventSlug);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await createTodoGroup(submission.id, name);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function renameTodoGroupAction(
  eventSlug: string,
  todoGroupId: string,
  formData: FormData
) {
  await requireLeader(eventSlug);
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await renameTodoGroup(todoGroupId, name);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function deleteTodoGroupAction(eventSlug: string, todoGroupId: string) {
  await requireLeader(eventSlug);
  await deleteTodoGroup(todoGroupId);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function createTodoTaskAction(
  eventSlug: string,
  todoGroupId: string | null,
  formData: FormData
) {
  const auth = await requireLeader(eventSlug);
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await createTodoTask(submission.id, todoGroupId, title);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function addTemplateTasksAction(eventSlug: string) {
  const auth = await requireLeader(eventSlug);
  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  await createTasksFromTemplate(submission.id, null);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function updateTodoTaskStatusAction(
  eventSlug: string,
  taskId: string,
  formData: FormData
) {
  await requireLeader(eventSlug);
  const status = String(formData.get("status") ?? "") as TodoStatus;
  if (status !== "not_started" && status !== "in_progress" && status !== "done") return;
  await updateTodoTaskStatus(taskId, status);
  revalidatePath(`/${eventSlug}/group/todos`);
}

export async function deleteTodoTaskAction(eventSlug: string, taskId: string) {
  await requireLeader(eventSlug);
  await deleteTodoTask(taskId);
  revalidatePath(`/${eventSlug}/group/todos`);
}

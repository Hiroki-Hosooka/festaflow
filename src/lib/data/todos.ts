import "server-only";
import { supabaseAdmin } from "@/lib/supabase";
import type { TodoStatus } from "@/lib/database.types";

export const TEMPLATE_TASKS = [
  "看板のデザイン決定",
  "担任教員への安全確認依頼",
  "買い出しリスト作成",
  "食材の衛生検便提出（飲食のみ）",
];

export async function listTodoGroups(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("todo_groups")
    .select("*")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listTodoTasks(submissionId: string) {
  const { data, error } = await supabaseAdmin()
    .from("todo_tasks")
    .select("*")
    .eq("submission_id", submissionId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTodoGroup(submissionId: string, name: string) {
  const { data: existing, error: countErr } = await supabaseAdmin()
    .from("todo_groups")
    .select("id")
    .eq("submission_id", submissionId);
  if (countErr) throw countErr;

  const { error } = await supabaseAdmin().from("todo_groups").insert({
    submission_id: submissionId,
    name,
    sort_order: existing?.length ?? 0,
  });
  if (error) throw error;
}

export async function renameTodoGroup(todoGroupId: string, name: string) {
  const { error } = await supabaseAdmin()
    .from("todo_groups")
    .update({ name })
    .eq("id", todoGroupId);
  if (error) throw error;
}

export async function deleteTodoGroup(todoGroupId: string) {
  const { error } = await supabaseAdmin().from("todo_groups").delete().eq("id", todoGroupId);
  if (error) throw error;
}

export async function createTodoTask(
  submissionId: string,
  todoGroupId: string | null,
  title: string
) {
  const { data: existing, error: countErr } = await supabaseAdmin()
    .from("todo_tasks")
    .select("id")
    .eq("submission_id", submissionId);
  if (countErr) throw countErr;

  const { error } = await supabaseAdmin().from("todo_tasks").insert({
    submission_id: submissionId,
    todo_group_id: todoGroupId,
    title,
    sort_order: existing?.length ?? 0,
  });
  if (error) throw error;
}

export async function createTasksFromTemplate(submissionId: string, todoGroupId: string | null) {
  const { data: existing, error: countErr } = await supabaseAdmin()
    .from("todo_tasks")
    .select("id")
    .eq("submission_id", submissionId);
  if (countErr) throw countErr;

  const startOrder = existing?.length ?? 0;
  const { error } = await supabaseAdmin()
    .from("todo_tasks")
    .insert(
      TEMPLATE_TASKS.map((title, index) => ({
        submission_id: submissionId,
        todo_group_id: todoGroupId,
        title,
        sort_order: startOrder + index,
      }))
    );
  if (error) throw error;
}

export async function updateTodoTaskStatus(taskId: string, status: TodoStatus) {
  const { error } = await supabaseAdmin()
    .from("todo_tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) throw error;
}

export async function deleteTodoTask(taskId: string) {
  const { error } = await supabaseAdmin().from("todo_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

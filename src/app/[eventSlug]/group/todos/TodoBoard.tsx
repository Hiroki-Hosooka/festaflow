"use client";

import { useState } from "react";
import {
  createTodoGroupAction,
  renameTodoGroupAction,
  deleteTodoGroupAction,
  createTodoTaskAction,
  addTemplateTasksAction,
  updateTodoTaskStatusAction,
  deleteTodoTaskAction,
} from "./actions";
import type { Database, TodoStatus } from "@/lib/database.types";

type TodoGroupRow = Database["public"]["Tables"]["todo_groups"]["Row"];
type TodoTaskRow = Database["public"]["Tables"]["todo_tasks"]["Row"];

const STATUS_LABELS: Record<TodoStatus, string> = {
  not_started: "未着手",
  in_progress: "進行中",
  done: "完了",
};

const STATUS_STYLES: Record<TodoStatus, string> = {
  not_started: "bg-[var(--status-unsubmitted-bg)] text-[var(--status-unsubmitted-text)]",
  in_progress: "bg-[var(--status-pending-bg)] text-[var(--status-pending-text)]",
  done: "bg-[var(--status-approved-bg)] text-[var(--status-approved-text)]",
};

export function TodoBoard({
  eventSlug,
  groups,
  tasks,
  canEdit,
}: {
  eventSlug: string;
  groups: TodoGroupRow[];
  tasks: TodoTaskRow[];
  canEdit: boolean;
}) {
  const boundCreateGroup = createTodoGroupAction.bind(null, eventSlug);
  const boundAddTemplate = addTemplateTasksAction.bind(null, eventSlug);

  const ungrouped = tasks.filter((t) => !t.todo_group_id);

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center gap-2 flex-wrap">
          <form action={boundCreateGroup} className="flex items-center gap-1.5">
            <input
              name="name"
              required
              placeholder="班の名前（例: 装飾班）"
              className="h-9 border border-[var(--border-strong)] rounded-md px-2.5 text-[12.5px]"
            />
            <button className="h-9 px-3 rounded-md text-[12.5px] font-semibold btn-group">
              班を追加
            </button>
          </form>
          <form action={boundAddTemplate}>
            <button className="h-9 px-3 rounded-md text-[12.5px] font-semibold border border-[var(--border-strong)] text-[var(--muted)]">
              テンプレートから追加
            </button>
          </form>
        </div>
      )}

      {groups.map((g) => (
        <TodoGroupCard
          key={g.id}
          eventSlug={eventSlug}
          group={g}
          tasks={tasks.filter((t) => t.todo_group_id === g.id)}
          canEdit={canEdit}
        />
      ))}

      {(ungrouped.length > 0 || (canEdit && groups.length === 0)) && (
        <TodoGroupCard eventSlug={eventSlug} group={null} tasks={ungrouped} canEdit={canEdit} />
      )}
    </div>
  );
}

function TodoGroupCard({
  eventSlug,
  group,
  tasks,
  canEdit,
}: {
  eventSlug: string;
  group: TodoGroupRow | null;
  tasks: TodoTaskRow[];
  canEdit: boolean;
}) {
  const [renaming, setRenaming] = useState(false);
  const boundRename = group
    ? renameTodoGroupAction.bind(null, eventSlug, group.id)
    : undefined;
  const boundDeleteGroup = group
    ? deleteTodoGroupAction.bind(null, eventSlug, group.id)
    : undefined;
  const boundCreateTask = createTodoTaskAction.bind(null, eventSlug, group?.id ?? null);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between gap-2">
        {group && renaming ? (
          <form
            action={async (formData) => {
              await boundRename?.(formData);
              setRenaming(false);
            }}
            className="flex items-center gap-1.5"
          >
            <input
              name="name"
              defaultValue={group.name}
              autoFocus
              className="h-8 border border-[var(--border-strong)] rounded-md px-2 text-[13px] font-semibold"
            />
            <button className="text-[11.5px] text-[var(--accent-group-text)] font-semibold">
              保存
            </button>
          </form>
        ) : (
          <h3
            className={`text-sm font-bold ${canEdit && group ? "cursor-pointer" : ""}`}
            onDoubleClick={() => group && canEdit && setRenaming(true)}
            title={group && canEdit ? "ダブルクリックで名称変更" : undefined}
          >
            {group ? group.name : "未分類"}
          </h3>
        )}
        {group && canEdit && (
          <form
            action={boundDeleteGroup}
            onSubmit={(e) => {
              if (!confirm(`「${group.name}」を削除しますか？（タスクは未分類に移動します）`))
                e.preventDefault();
            }}
          >
            <button className="text-[11px] text-[var(--danger-text)] font-semibold">
              班を削除
            </button>
          </form>
        )}
      </div>

      <div className="space-y-1.5">
        {tasks.length === 0 && (
          <p className="text-[12px] text-[var(--muted-2)]">タスクはありません。</p>
        )}
        {tasks.map((t) => (
          <TaskRow key={t.id} eventSlug={eventSlug} task={t} canEdit={canEdit} />
        ))}
      </div>

      {canEdit && (
        <form action={boundCreateTask} className="flex items-center gap-1.5">
          <input
            name="title"
            required
            placeholder="タスクを追加"
            className="h-8 flex-1 border border-[var(--border)] rounded-md px-2 text-[12.5px]"
          />
          <button className="text-[11.5px] text-[var(--accent-group-text)] font-semibold whitespace-nowrap">
            ＋ 追加
          </button>
        </form>
      )}
    </div>
  );
}

function TaskRow({
  eventSlug,
  task,
  canEdit,
}: {
  eventSlug: string;
  task: TodoTaskRow;
  canEdit: boolean;
}) {
  const boundStatus = updateTodoTaskStatusAction.bind(null, eventSlug, task.id);
  const boundDelete = deleteTodoTaskAction.bind(null, eventSlug, task.id);

  return (
    <div className="flex items-center justify-between gap-2 border border-[var(--border)] rounded-lg px-3 py-2 text-[12.5px]">
      <span>{task.title}</span>
      <div className="flex items-center gap-2 flex-none">
        {canEdit ? (
          <form action={boundStatus}>
            <select
              name="status"
              defaultValue={task.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className={`status-badge border-0 ${STATUS_STYLES[task.status]}`}
            >
              {(Object.keys(STATUS_LABELS) as TodoStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </form>
        ) : (
          <span className={`status-badge ${STATUS_STYLES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        )}
        {canEdit && (
          <form action={boundDelete}>
            <button
              className="text-[var(--muted-2)] text-sm"
              aria-label={`${task.title}を削除`}
            >
              ×
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

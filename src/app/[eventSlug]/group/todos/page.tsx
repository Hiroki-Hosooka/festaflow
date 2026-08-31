import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listTodoGroups, listTodoTasks } from "@/lib/data/todos";
import { TodoBoard } from "./TodoBoard";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function GroupTodosPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);

  const submission = await getOrCreateSubmission(auth.eventId, auth.groupId);
  const [groups, tasks] = await Promise.all([
    listTodoGroups(submission.id),
    listTodoTasks(submission.id),
  ]);

  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/group` }, { label: "ToDoリスト" }]} />
      <h1 className="page-title">クラスToDoリスト</h1>
      <TodoBoard
        eventSlug={eventSlug}
        groups={groups}
        tasks={tasks}
        canEdit={auth.role === "leader"}
      />
    </div>
  );
}

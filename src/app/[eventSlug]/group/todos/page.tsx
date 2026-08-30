import { requireGroupSession } from "@/lib/session";
import { getOrCreateSubmission } from "@/lib/data/submissions";
import { listTodoGroups, listTodoTasks } from "@/lib/data/todos";
import { TodoBoard } from "./TodoBoard";

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
      <h1 className="text-lg font-bold">クラスToDoリスト</h1>
      <TodoBoard
        eventSlug={eventSlug}
        groups={groups}
        tasks={tasks}
        canEdit={auth.role === "leader"}
      />
    </div>
  );
}

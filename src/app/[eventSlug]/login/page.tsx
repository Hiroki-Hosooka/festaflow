import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data/events";
import { listGroups } from "@/lib/data/groups";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();

  const groups = await listGroups(event.id);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <LoginForm
        eventSlug={eventSlug}
        eventName={event.name}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />
    </main>
  );
}

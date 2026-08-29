import { requireGroupSession } from "@/lib/session";
import { ChangePassphraseForm } from "./ChangePassphraseForm";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  await requireGroupSession(eventSlug);

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-lg font-bold">合言葉の変更</h1>
      <div className="card p-6 sm:p-7">
        <ChangePassphraseForm eventSlug={eventSlug} />
      </div>
    </div>
  );
}

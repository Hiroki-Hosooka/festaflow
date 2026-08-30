import { redirect } from "next/navigation";
import { requireGroupSession } from "@/lib/session";
import { getGroup } from "@/lib/data/groups";
import { ChangePassphraseForm } from "./ChangePassphraseForm";
import { MemberPassphraseForm } from "./MemberPassphraseForm";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const auth = await requireGroupSession(eventSlug);
  if (auth.role !== "leader") {
    redirect(`/${eventSlug}/group`);
  }

  const group = await getGroup(auth.groupId);

  return (
    <div className="space-y-5 max-w-sm">
      <h1 className="text-lg font-bold">合言葉の変更</h1>
      <div className="card p-6 sm:p-7">
        <ChangePassphraseForm eventSlug={eventSlug} />
      </div>
      <h2 className="text-lg font-bold pt-2">一般生徒用合言葉</h2>
      <div className="card p-6 sm:p-7">
        <MemberPassphraseForm
          eventSlug={eventSlug}
          hasMemberPassphrase={!!group?.member_passphrase_hash}
        />
      </div>
    </div>
  );
}

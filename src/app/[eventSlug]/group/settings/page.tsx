import { redirect } from "next/navigation";
import { requireGroupSession } from "@/lib/session";
import { getGroup } from "@/lib/data/groups";
import { ChangePassphraseForm } from "./ChangePassphraseForm";
import { MemberPassphraseForm } from "./MemberPassphraseForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "ホーム", href: `/${eventSlug}/group` }, { label: "設定" }]} />
      <h1 className="page-title">設定</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="card p-6 sm:p-7 space-y-4">
          <h2 className="card-heading">合言葉の変更</h2>
          <ChangePassphraseForm eventSlug={eventSlug} />
        </div>
        <div className="card p-6 sm:p-7 space-y-4">
          <h2 className="card-heading">一般生徒用合言葉</h2>
          <MemberPassphraseForm
            eventSlug={eventSlug}
            hasMemberPassphrase={!!group?.member_passphrase_hash}
          />
        </div>
      </div>
    </div>
  );
}

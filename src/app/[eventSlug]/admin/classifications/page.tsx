import { redirect } from "next/navigation";

export default async function AdminClassificationsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  redirect(`/${eventSlug}/admin/form-settings?tab=classifications`);
}

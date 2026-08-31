import { redirect } from "next/navigation";

export default async function AdminFieldsPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  redirect(`/${eventSlug}/admin/form-settings`);
}

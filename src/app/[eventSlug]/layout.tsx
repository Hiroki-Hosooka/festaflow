import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data/events";

export const dynamic = "force-dynamic";

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;
  const event = await getEventBySlug(eventSlug);
  if (!event) notFound();
  return <>{children}</>;
}

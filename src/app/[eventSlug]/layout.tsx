import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/data/events";
import { getThemeCssVars } from "@/lib/themes";

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
  const themeVars = getThemeCssVars(event.theme);
  return (
    <div style={{ display: "contents", ...themeVars } as React.CSSProperties}>{children}</div>
  );
}

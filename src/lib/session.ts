import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";

export type GroupRole = "leader" | "member";

export type SessionAuth =
  | { kind: "admin"; eventId: string; eventSlug: string }
  | {
      kind: "group";
      eventId: string;
      eventSlug: string;
      groupId: string;
      groupName: string;
      role: GroupRole;
    };

interface SessionShape {
  auth?: SessionAuth;
}

function sessionPassword() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters (.env.local)."
    );
  }
  return secret;
}

const sessionOptions = {
  cookieName: "kikaku_session",
  get password() {
    return sessionPassword();
  },
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionShape>(cookieStore, sessionOptions);
}

export async function requireGroupSession(eventSlug: string) {
  const session = await getSession();
  const auth = session.auth;
  if (!auth || auth.kind !== "group" || auth.eventSlug !== eventSlug) {
    redirect(`/${eventSlug}/login`);
  }
  return auth;
}

export async function requireAdminSession(eventSlug: string) {
  const session = await getSession();
  const auth = session.auth;
  if (!auth || auth.kind !== "admin" || auth.eventSlug !== eventSlug) {
    redirect(`/${eventSlug}/login`);
  }
  return auth;
}

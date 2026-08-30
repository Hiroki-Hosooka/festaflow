"use server";

import { redirect } from "next/navigation";
import { getEventBySlug } from "@/lib/data/events";
import { listGroups } from "@/lib/data/groups";
import { verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function groupLoginAction(
  eventSlug: string,
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const groupId = String(formData.get("groupId") ?? "");
  const passphrase = String(formData.get("passphrase") ?? "");
  if (!groupId || !passphrase) {
    return { error: "団体と合言葉を入力してください。" };
  }

  const event = await getEventBySlug(eventSlug);
  if (!event) return { error: "イベントが見つかりません。" };

  const groups = await listGroups(event.id);
  const group = groups.find((g) => g.id === groupId);
  if (!group) return { error: "団体が見つかりません。" };

  const isLeader = await verifyPassword(passphrase, group.passphrase_hash);
  const isMember =
    !isLeader &&
    !!group.member_passphrase_hash &&
    (await verifyPassword(passphrase, group.member_passphrase_hash));
  if (!isLeader && !isMember) return { error: "合言葉が正しくありません。" };

  const session = await getSession();
  session.auth = {
    kind: "group",
    eventId: event.id,
    eventSlug,
    groupId: group.id,
    groupName: group.name,
    role: isLeader ? "leader" : "member",
  };
  await session.save();
  redirect(`/${eventSlug}/group`);
}

export async function adminLoginAction(
  eventSlug: string,
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const loginId = String(formData.get("loginId") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!loginId || !password) {
    return { error: "IDとパスワードを入力してください。" };
  }

  const event = await getEventBySlug(eventSlug);
  if (!event) return { error: "イベントが見つかりません。" };

  if (loginId !== event.admin_login_id) {
    return { error: "IDまたはパスワードが正しくありません。" };
  }
  const ok = await verifyPassword(password, event.admin_password_hash);
  if (!ok) return { error: "IDまたはパスワードが正しくありません。" };

  const session = await getSession();
  session.auth = { kind: "admin", eventId: event.id, eventSlug };
  await session.save();
  redirect(`/${eventSlug}/admin`);
}

export async function logoutAction(eventSlug: string) {
  const session = await getSession();
  session.destroy();
  redirect(`/${eventSlug}/login`);
}

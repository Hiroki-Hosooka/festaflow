"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/session";
import { updateEventSettings, updateEventTheme, updateEventNavConfig } from "@/lib/data/events";
import {
  addAdminPushSubscription,
  removePushSubscription,
  type PushSubscriptionInput,
} from "@/lib/data/pushSubscriptions";
import { ADMIN_NAV_REGISTRY, GROUP_NAV_REGISTRY, LOCKED_NAV_KEYS } from "@/lib/navRegistry";
import type { ThemeKey } from "@/lib/database.types";
import type { NavConfigEditorState } from "@/components/NavConfigEditor";

const THEME_KEYS: ThemeKey[] = ["default", "autumn", "sakura", "ocean", "mono"];

export interface EventSettingsFormState {
  error?: string;
  success?: string;
}

export async function updateEventSettingsAction(
  eventSlug: string,
  _prevState: EventSettingsFormState,
  formData: FormData
): Promise<EventSettingsFormState> {
  const auth = await requireAdminSession(eventSlug);
  const name = String(formData.get("name") ?? "").trim();
  const adminLabel = String(formData.get("admin_label") ?? "").trim();

  if (!name) return { error: "イベント名を入力してください。" };
  if (!adminLabel) return { error: "管理者の名称を入力してください。" };

  await updateEventSettings(auth.eventId, { name, adminLabel });
  revalidatePath(`/${eventSlug}`, "layout");
  return { success: "設定を保存しました。" };
}

export interface ThemeFormState {
  error?: string;
  success?: string;
}

export async function updateThemeAction(
  eventSlug: string,
  _prevState: ThemeFormState,
  formData: FormData
): Promise<ThemeFormState> {
  const auth = await requireAdminSession(eventSlug);
  const theme = String(formData.get("theme") ?? "default") as ThemeKey;
  if (!THEME_KEYS.includes(theme)) return { error: "テーマが不正です。" };

  await updateEventTheme(auth.eventId, theme);
  revalidatePath(`/${eventSlug}`, "layout");
  return { success: "テーマを変更しました。" };
}

function parseNavConfigFromFormData(formData: FormData, registryKeys: Set<string>, lockedKeys: Set<string>) {
  const order = formData.getAll("order").map(String).filter((k) => registryKeys.has(k));
  return order.map((key) => ({
    key,
    visible: lockedKeys.has(key) ? true : formData.get(`visible:${key}`) === "on",
  }));
}

export async function updateAdminNavConfigAction(
  eventSlug: string,
  _prevState: NavConfigEditorState,
  formData: FormData
): Promise<NavConfigEditorState> {
  const auth = await requireAdminSession(eventSlug);
  const registryKeys = new Set(ADMIN_NAV_REGISTRY.map((i) => i.key));
  const config = parseNavConfigFromFormData(formData, registryKeys, LOCKED_NAV_KEYS);
  await updateEventNavConfig(auth.eventId, "admin", config);
  revalidatePath(`/${eventSlug}`, "layout");
  return { success: "ナビゲーションの設定を保存しました。" };
}

export async function updateGroupNavConfigAction(
  eventSlug: string,
  _prevState: NavConfigEditorState,
  formData: FormData
): Promise<NavConfigEditorState> {
  const auth = await requireAdminSession(eventSlug);
  const registryKeys = new Set(GROUP_NAV_REGISTRY.map((i) => i.key));
  const config = parseNavConfigFromFormData(formData, registryKeys, LOCKED_NAV_KEYS);
  await updateEventNavConfig(auth.eventId, "group", config);
  revalidatePath(`/${eventSlug}`, "layout");
  return { success: "ナビゲーションの設定を保存しました。" };
}

export async function subscribeAdminPushAction(eventSlug: string, sub: PushSubscriptionInput) {
  const auth = await requireAdminSession(eventSlug);
  await addAdminPushSubscription(auth.eventId, sub);
}

export async function unsubscribeAdminPushAction(eventSlug: string, endpoint: string) {
  await requireAdminSession(eventSlug);
  await removePushSubscription(endpoint);
}

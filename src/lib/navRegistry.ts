import type { NavItemConfig } from "@/lib/database.types";

export interface NavRegistryItem {
  key: string;
  label: string;
  icon: string;
  hrefSuffix: string;
}

// 表示順・表示/非表示のデフォルト（イベント側で未設定の場合はこの順・全表示になる）
export const ADMIN_NAV_REGISTRY: NavRegistryItem[] = [
  { key: "submissions", label: "企画一覧", icon: "clipboard", hrefSuffix: "/admin/submissions" },
  { key: "messages", label: "連絡", icon: "inbox", hrefSuffix: "/admin/messages" },
  { key: "inventory", label: "在庫管理", icon: "package", hrefSuffix: "/admin/inventory" },
  { key: "groups", label: "団体・予算", icon: "users", hrefSuffix: "/admin/groups" },
  { key: "formSettings", label: "フォーム設定", icon: "receipt", hrefSuffix: "/admin/form-settings" },
  { key: "settings", label: "設定", icon: "settings", hrefSuffix: "/admin/settings" },
];

export const GROUP_NAV_REGISTRY: NavRegistryItem[] = [
  { key: "submission", label: "企画", icon: "clipboard", hrefSuffix: "/group/submission" },
  { key: "messages", label: "連絡・コメント", icon: "chat", hrefSuffix: "/group/messages" },
  { key: "shifts", label: "当番シフト", icon: "calendar", hrefSuffix: "/group/shifts" },
  { key: "todos", label: "ToDoリスト", icon: "checkSquare", hrefSuffix: "/group/todos" },
  { key: "settings", label: "設定", icon: "settings", hrefSuffix: "/group/settings" },
];

// ロックされている項目（自分自身のいるページのため、非表示にはできない）
export const LOCKED_NAV_KEYS = new Set(["settings"]);

// 保存済みの並び順・表示設定と、登録済みの項目一覧を突き合わせる。
// 未設定(null)の場合はレジストリの並びをそのまま使う。保存後に項目が追加された場合も、
// 保存データにないキーはレジストリの並び順の位置に補って表示する。
export function resolveNavConfig(
  registry: NavRegistryItem[],
  stored: NavItemConfig[] | null
): NavItemConfig[] {
  if (!stored || stored.length === 0) {
    return registry.map((item) => ({ key: item.key, visible: true }));
  }
  const registryKeys = new Set(registry.map((item) => item.key));
  const resolved = stored.filter((entry) => registryKeys.has(entry.key));
  const seenKeys = new Set(resolved.map((entry) => entry.key));
  for (const item of registry) {
    if (!seenKeys.has(item.key)) {
      resolved.push({ key: item.key, visible: true });
    }
  }
  return resolved;
}

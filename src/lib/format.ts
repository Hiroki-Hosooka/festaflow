const dateTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDateTime(iso: string) {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTime(iso: string) {
  return timeFormatter.format(new Date(iso));
}

export function yen(amount: number) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

const jstPartsFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// <input type="datetime-local"> の value（JSTの壁時計表示）へ変換する
export function toJstDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const parts = jstPartsFormatter.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// <input type="datetime-local"> の value（JST壁時計として入力された文字列）をISO文字列へ変換する
export function parseJstDatetimeLocal(value: string): string {
  return new Date(`${value}:00+09:00`).toISOString();
}

// 締切までの残り日数（切り上げ）。負の値は締切超過を意味する。
export function daysUntil(iso: string): number {
  const diffMs = new Date(iso).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 直近の相対時間（「たった今」「5分前」など）
export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}時間前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}日前`;
  return formatDateTime(iso);
}

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

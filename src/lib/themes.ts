import type { ThemeKey } from "@/lib/database.types";

interface ThemeHues {
  label: string;
  groupHue: number;
  adminHue: number;
  groupChroma: number;
  adminChroma: number;
}

// 各テーマは色相(hue)だけを変え、明度・彩度は視認性検証済みのデフォルト値を踏襲する
// （コントラスト比を崩さないため）
const THEMES: Record<ThemeKey, ThemeHues> = {
  default: { label: "デフォルト（若葉×藍）", groupHue: 165, adminHue: 255, groupChroma: 0.09, adminChroma: 0.09 },
  autumn: { label: "秋（琥珀×テラコッタ）", groupHue: 70, adminHue: 40, groupChroma: 0.1, adminChroma: 0.08 },
  sakura: { label: "桜（桃×紫）", groupHue: 350, adminHue: 300, groupChroma: 0.1, adminChroma: 0.08 },
  ocean: { label: "海（ターコイズ×群青）", groupHue: 195, adminHue: 250, groupChroma: 0.09, adminChroma: 0.1 },
  mono: { label: "モノクロ", groupHue: 155, adminHue: 155, groupChroma: 0.01, adminChroma: 0.01 },
};

export const THEME_OPTIONS: { value: ThemeKey; label: string }[] = (
  Object.keys(THEMES) as ThemeKey[]
).map((key) => ({ value: key, label: THEMES[key].label }));

export function getThemeCssVars(theme: ThemeKey): Record<string, string> {
  const t = THEMES[theme] ?? THEMES.default;
  const isMono = theme === "mono";

  return {
    "--accent-group-solid": `oklch(${isMono ? 42 : 46}% ${t.groupChroma} ${t.groupHue})`,
    "--accent-group-solid-hover": `oklch(${isMono ? 34 : 40}% ${t.groupChroma} ${t.groupHue})`,
    "--accent-group-text": `oklch(${isMono ? 40 : 44}% ${t.groupChroma} ${t.groupHue})`,
    "--accent-group-soft-bg": `oklch(94% ${isMono ? 0.005 : 0.035} ${t.groupHue})`,
    "--accent-admin-solid": `oklch(${isMono ? 24 : 40}% ${t.adminChroma} ${t.adminHue})`,
    "--accent-admin-solid-hover": `oklch(${isMono ? 18 : 34}% ${t.adminChroma} ${t.adminHue})`,
    "--accent-admin-text": `oklch(${isMono ? 22 : 40}% ${t.adminChroma} ${t.adminHue})`,
    "--accent-admin-soft-bg": `oklch(94% ${isMono ? 0.005 : 0.025} ${t.adminHue})`,
  };
}

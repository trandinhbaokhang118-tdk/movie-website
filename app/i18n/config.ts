export const LOCALE_COOKIE = "cinewave_locale";

export const supportedLocales = ["vi-VN", "en-US", "fr-FR", "ja-JP", "ko-KR", "zh-CN"] as const;
export type AppLocale = (typeof supportedLocales)[number];

export const localeOptions: Array<{ value: AppLocale; code: string; label: string }> = [
  { value: "vi-VN", code: "VI", label: "Tiếng Việt" },
  { value: "en-US", code: "EN", label: "English" },
  { value: "fr-FR", code: "FR", label: "Français" },
  { value: "ja-JP", code: "JA", label: "日本語" },
  { value: "ko-KR", code: "KO", label: "한국어" },
  { value: "zh-CN", code: "ZH", label: "简体中文" },
];

export function normalizeLocale(value: unknown): AppLocale {
  return supportedLocales.includes(value as AppLocale) ? value as AppLocale : "vi-VN";
}

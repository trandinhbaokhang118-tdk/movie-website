"use client";

import { useRef, useTransition } from "react";
import { updateLocaleAction } from "../actions/locale";
import { localeOptions, type AppLocale } from "../i18n/config";

export function LocaleSwitcher({ locale, compact = false }: { locale: AppLocale; compact?: boolean }) {
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const options = compact ? localeOptions.filter((option) => ["vi-VN", "en-US"].includes(option.value)) : localeOptions;
  return (
    <form ref={form} className={`locale-switcher${compact ? " is-compact" : ""}`} action={updateLocaleAction}>
      <input name="returnTo" type="hidden" defaultValue="/" />
      <label>
        <span className={compact ? "sr-only" : "locale-field-label"}>Ngôn ngữ hiển thị</span>
        <select
          data-no-translate
          name="locale"
          defaultValue={locale}
          disabled={pending}
          aria-label="Ngôn ngữ hiển thị"
          onChange={() => {
            const target = form.current;
            if (!target) return;
            const returnTo = target.elements.namedItem("returnTo") as HTMLInputElement;
            returnTo.value = `${window.location.pathname}${window.location.search}`;
            startTransition(() => target.requestSubmit());
          }}
        >
          {options.map((option) => <option key={option.value} value={option.value}>{compact ? `${option.code} · ${option.label}` : option.label}</option>)}
        </select>
      </label>
      <noscript><button className="button button-secondary" type="submit">Lưu lựa chọn</button></noscript>
    </form>
  );
}

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

export function HeaderSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!host.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        input.current?.blur();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedQuery = (input.current?.value ?? query).trim();
    if (!normalizedQuery) {
      input.current?.focus();
      return;
    }
    window.location.assign(`/search?${new URLSearchParams({ q: normalizedQuery })}`);
  };

  return (
    <div ref={host} className={`header-search${open ? " is-open" : ""}`}>
      <form className="header-search-form" action="/search" method="get" role="search" onSubmit={submit}>
        <label className="sr-only" htmlFor="header-movie-search">Tìm phim, series hoặc diễn viên</label>
        <input
          ref={input}
          id="header-movie-search"
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm phim, series, diễn viên…"
          autoComplete="off"
          onFocus={() => setOpen(true)}
        />
        {open && query ? <button className="header-search-clear" type="button" onClick={() => { setQuery(""); input.current?.focus(); }} aria-label="Xóa từ khóa">×</button> : null}
        <button
          className="header-search-submit"
          type={open ? "submit" : "button"}
          aria-label={open ? "Tìm kiếm từ khóa" : "Mở tìm kiếm"}
          title="Tìm kiếm"
          aria-expanded={open}
          aria-controls="header-movie-search"
          onClick={() => { if (!open) setOpen(true); }}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.75" /><path d="m15.55 15.55 4.7 4.7" /></svg>
        </button>
      </form>
    </div>
  );
}

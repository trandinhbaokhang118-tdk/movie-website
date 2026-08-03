"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, registerAction } from "../actions/auth";
import { Brand } from "./Brand";

type Mode = "login" | "register";
type TurnstileApi = {
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(widgetId: string): void;
};

declare global {
  interface Window { turnstile?: TurnstileApi; }
}

const subscribeToClient = () => () => undefined;

export function AuthExperience({
  siteKey,
  initialMode = "login",
  initialOpen = false,
  standalone = false,
  returnTo = "/",
  error,
  defaultEmail = "",
  currentEmail,
  renderChallenge = true,
}: {
  siteKey: string;
  initialMode?: Mode;
  initialOpen?: boolean;
  standalone?: boolean;
  returnTo?: string;
  error?: string;
  defaultEmail?: string;
  currentEmail?: string;
  renderChallenge?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  const [mode, setMode] = useState<Mode>(initialMode);
  const mounted = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const titleId = useId();

  const close = useCallback(() => {
    if (standalone) window.location.assign("/");
    else setOpen(false);
  }, [standalone]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [close, open]);

  return (
    <>
      {!standalone ? <button className="button button-small auth-open-button" type="button" onClick={() => setOpen(true)}>Đăng nhập</button> : null}
      {mounted && open ? createPortal(
        <div className="auth-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
            <button className="auth-modal-close" type="button" onClick={close} aria-label="Đóng cửa sổ xác thực">×</button>
            <MiniatureHome />
            <div className="auth-panel">
              <div className="auth-panel-brand"><Brand /><span>SECURE ACCESS</span></div>
              <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức xác thực">
                <button className={mode === "login" ? "is-active" : ""} type="button" role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>Đăng nhập</button>
                <button className={mode === "register" ? "is-active" : ""} type="button" role="tab" aria-selected={mode === "register"} onClick={() => setMode("register")}>Đăng ký</button>
              </div>
              <div className="auth-panel-heading">
                <p className="eyebrow">{mode === "login" ? "CHÀO MỪNG TRỞ LẠI" : "THAM GIA CINEWAVE"}</p>
                <h1 id={titleId}>{mode === "login" ? "Đăng nhập." : "Tạo tài khoản."}</h1>
                {currentEmail && mode === "login" ? <p>Chuyển khỏi tài khoản {currentEmail}.</p> : null}
              </div>
              {error ? <p className="auth-error" role="alert">{error}</p> : null}

              {mode === "login" ? (
                <form action={loginAction} className="auth-form auth-form-premium">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label>Email<input name="email" type="email" autoComplete="email" defaultValue={defaultEmail} placeholder="ban@example.com" required /></label>
                  <PasswordField autoComplete="current-password" />
                  {renderChallenge ? <TurnstileWidget siteKey={siteKey} action="login" /> : <TurnstileTestPlaceholder />}
                  <button className="button button-cinema auth-submit" type="submit" disabled={renderChallenge && !siteKey}><span aria-hidden="true">→</span> Đăng nhập</button>
                </form>
              ) : (
                <form action={registerAction} className="auth-form auth-form-premium">
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <label>Tên hiển thị<input name="displayName" type="text" autoComplete="name" minLength={2} maxLength={60} placeholder="Tên bạn muốn hiển thị" required /></label>
                  <label>Email<input name="email" type="email" autoComplete="email" defaultValue={defaultEmail} placeholder="ban@example.com" required /></label>
                  <PasswordField autoComplete="new-password" maxLength={128} />
                  {renderChallenge ? <TurnstileWidget siteKey={siteKey} action="register" /> : <TurnstileTestPlaceholder />}
                  <button className="button button-cinema auth-submit" type="submit" disabled={renderChallenge && !siteKey}><span aria-hidden="true">＋</span> Tạo tài khoản</button>
                </form>
              )}
              {renderChallenge && !siteKey ? <p className="auth-config-warning" role="alert">Không thể tải xác thực Cloudflare.</p> : null}
            </div>
          </section>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

function PasswordField({ autoComplete, maxLength }: { autoComplete: "current-password" | "new-password"; maxLength?: number }) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return <div className="auth-field">
    <label htmlFor={inputId}>Mật khẩu</label>
    <span className="auth-password-field">
      <input
        id={inputId}
        name="password"
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        minLength={10}
        maxLength={maxLength}
        placeholder="Tối thiểu 10 ký tự, gồm chữ và số"
        required
      />
      <button
        type="button"
        className="auth-password-toggle"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </span>
  </div>;
}

function TurnstileTestPlaceholder() {
  return <input type="hidden" name="cf-turnstile-response" value="cinewave-local-turnstile" />;
}

function MiniatureHome() {
  const ranked = [
    { title: "Sprite Fright", meta: "Hoạt hình 3D · 2021", image: "/media/artwork/sprite-fright-hero.jpg", rank: 1 },
    { title: "Sintel", meta: "Phiêu lưu · 2010", image: "/media/artwork/sintel-poster.jpg", rank: 2 },
    { title: "Tears of Steel", meta: "Khoa học viễn tưởng · 2012", image: "/media/artwork/tears-of-steel-poster.jpg", rank: 3 },
  ];
  const [activeMovie, setActiveMovie] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveMovie((current) => (current + 1) % ranked.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [ranked.length]);

  return <aside className="auth-preview" aria-label="Top 3 phim được yêu thích tuần này">
    <div className="auth-preview-top"><Brand /><span>TOP 3 TUẦN NÀY</span></div>
    <div className="auth-ranking-carousel">
      <div className="auth-ranking-track" style={{ transform: `translateX(-${activeMovie * 100}%)` }}>
        {ranked.map((movie, index) => <article className={`auth-ranking-card rank-${movie.rank}`} aria-hidden={activeMovie !== index} key={movie.title}>
          <div className="auth-ranking-poster" style={{ backgroundImage: `url(${movie.image})` }}><span className="auth-rank-badge">{movie.rank}</span></div>
          <div className="auth-ranking-info"><strong>{movie.title}</strong><small>{movie.meta}</small><em>Hạng {movie.rank} tuần này</em></div>
        </article>)}
      </div>
    </div>
    <div className="auth-ranking-dots" role="tablist" aria-label="Chọn phim trong Top 3">
      {ranked.map((movie, index) => <button className={activeMovie === index ? "is-active" : ""} type="button" role="tab" aria-selected={activeMovie === index} aria-label={`Xem phim hạng ${movie.rank}: ${movie.title}`} onClick={() => setActiveMovie(index)} key={movie.title} />)}
    </div>
  </aside>;
}
function TurnstileWidget({ siteKey, action }: { siteKey: string; action: Mode }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey || !container.current) return;
    let cancelled = false;
    let widgetId: string | undefined;
    const render = () => {
      if (cancelled || !container.current || !window.turnstile) return;
      widgetId = window.turnstile.render(container.current, {
        sitekey: siteKey,
        theme: "dark",
        size: "flexible",
        appearance: "interaction-only",
        action,
        language: "vi",
      });
    };
    if (window.turnstile) render();
    else {
      let script = document.querySelector<HTMLScriptElement>("script[data-cinewave-turnstile]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.cinewaveTurnstile = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render, { once: true });
    }
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, action]);

  return <div className="turnstile-shell"><div ref={container} /><span>Cloudflare đang xác minh kết nối an toàn</span></div>;
}


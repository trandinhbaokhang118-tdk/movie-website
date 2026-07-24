"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Check,
  ChevronRight,
  CircleUserRound,
  Crown,
  Download,
  Flame,
  Laptop,
  LogOut,
  MonitorDown,
  Play,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPaymentInvoiceAction } from "../actions/billing";
import { logoutAction } from "../actions/auth";
import { formatVnd, membershipPlans, type MembershipPlanCode } from "@/lib/membership";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type QrCodeInstance = {
  addData(value: string): void;
  make(): void;
  createDataURL(cellSize?: number, margin?: number): string;
};

declare global {
  interface Window {
    qrcode?: (typeNumber: number, errorCorrectionLevel: "L" | "M" | "Q" | "H") => QrCodeInstance;
  }
}

type HeaderViewer = {
  displayName: string;
  profileName: string;
  avatarColor: string;
  avatarUrl: string | null;
  currentPlan: string | null;
} | null;

const planDetails: Record<MembershipPlanCode, { accent: string; benefits: string[]; badge?: string }> = {
  moon: {
    accent: "#62e7e2",
    benefits: ["1 thiết bị cùng lúc", "Full HD sắc nét", "Không quảng cáo"],
  },
  eclipse: {
    accent: "#a89cff",
    badge: "Phổ biến",
    benefits: ["2 thiết bị cùng lúc", "Chất lượng 2K", "Âm thanh nâng cao"],
  },
  constellation: {
    accent: "#f6c56f",
    badge: "Trọn vẹn",
    benefits: ["4 thiết bị cùng lúc", "4K HDR", "Premiere và Spatial Audio"],
  },
};

export function HeaderExperience({ viewer }: { viewer: HeaderViewer }) {
  const [vipOpen, setVipOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanCode>(
    (viewer?.currentPlan as MembershipPlanCode | null) ?? "eclipse",
  );
  const [agreed, setAgreed] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState("");
  const [qrUrl, setQrUrl] = useState("");

  const chosenPlan = useMemo(
    () => membershipPlans.find((plan) => plan.code === selectedPlan) ?? membershipPlans[1],
    [selectedPlan],
  );

  useEffect(() => {
    let mounted = true;
    const qrTimer = window.setTimeout(() => {
      const createQr = () => {
        if (!window.qrcode) return;
        const code = window.qrcode(0, "M");
        code.addData(window.location.origin);
        code.make();
        if (mounted) setQrUrl(code.createDataURL(5, 3));
      };
      if (window.qrcode) {
        createQr();
        return;
      }
      const existing = document.querySelector<HTMLScriptElement>('script[data-cinewave-qr]');
      if (existing) {
        existing.addEventListener("load", createQr, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "/qrcode-generator.js";
      script.async = true;
      script.dataset.cinewaveQr = "true";
      script.addEventListener("load", createQr, { once: true });
      document.head.appendChild(script);
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => {
      setInstallPrompt(null);
      setInstallStatus("CineWave đã được cài trên thiết bị.");
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      mounted = false;
      window.clearTimeout(qrTimer);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    if (!vipOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVipOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [vipOpen]);

  async function installApp() {
    if (!installPrompt) {
      setInstallStatus("Mở menu trình duyệt và chọn “Cài đặt ứng dụng” để hoàn tất.");
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallStatus(choice.outcome === "accepted" ? "Đang cài CineWave…" : "Bạn có thể cài lại bất cứ lúc nào.");
    setInstallPrompt(null);
  }

  return (
    <div className="header-experience">
      {viewer ? (
        <div className="header-popover profile-popover">
          <button className="profile-trigger" type="button" aria-label={`Tài khoản ${viewer.profileName}`} aria-haspopup="menu">
            <span className="header-profile-avatar" style={{ background: viewer.avatarColor }}>
              {viewer.avatarUrl ? <Image src={viewer.avatarUrl} alt="" width={32} height={32} unoptimized /> : viewer.profileName.slice(0, 1).toUpperCase()}
            </span>
            <span className="profile-trigger-label">{viewer.profileName}</span>
          </button>
          <div className="header-dropdown profile-dropdown" role="menu">
            <div className="profile-dropdown-heading">
              <span className="header-profile-avatar header-profile-avatar-large" style={{ background: viewer.avatarColor }}>
                {viewer.avatarUrl ? <Image src={viewer.avatarUrl} alt="" width={39} height={39} unoptimized /> : viewer.profileName.slice(0, 1).toUpperCase()}
              </span>
              <div><strong>{viewer.profileName}</strong><small>{viewer.displayName}</small></div>
            </div>
            <Link href="/account" role="menuitem"><CircleUserRound size={18} /><span>Tài khoản của tôi</span><ChevronRight size={16} /></Link>
            <Link href="/profiles" role="menuitem"><UsersRound size={18} /><span>Chuyển hồ sơ</span><ChevronRight size={16} /></Link>
            <form action={logoutAction}>
              <button type="submit" role="menuitem"><LogOut size={18} /><span>Đăng xuất</span></button>
            </form>
          </div>
        </div>
      ) : (
        <Link className="header-login" href="/login">Đăng nhập</Link>
      )}

      <div className="header-popover app-popover">
        <button className="header-tool-button app-trigger" type="button" aria-haspopup="menu">
          <Download size={17} /><span>Tải app</span>
          <small>Cài miễn phí</small>
        </button>
        <div className="header-dropdown app-dropdown" role="menu">
          <section>
            <div className="app-option-heading"><Tv size={19} /><div><strong>TV App</strong><small>Không gian điện ảnh trên màn hình lớn</small></div></div>
            <button className="app-primary-action" type="button" onClick={installApp}><MonitorDown size={17} /> Cài ngay</button>
          </section>
          <section className="mobile-app-option">
            <div>
              <div className="app-option-heading"><Smartphone size={19} /><div><strong>Mobile App</strong><small>Quét QR để mở CineWave trên điện thoại</small></div></div>
              <span className="app-new-user">Đồng bộ danh sách và tiến độ xem</span>
            </div>
            {/* The QR points to the current deployment, including local development. */}
            {qrUrl
              ? <Image src={qrUrl} alt="Mã QR mở CineWave trên điện thoại" width={84} height={84} unoptimized />
              : <span className="app-qr-placeholder" aria-label="Đang tạo mã QR" />}
          </section>
          <section>
            <div className="app-option-heading"><Laptop size={19} /><div><strong>PC App</strong><small>Nhanh, ổn định và xem toàn màn hình</small></div></div>
            <button className="app-compact-action" type="button" onClick={installApp}>Cài <Download size={15} /></button>
          </section>
          {installStatus ? <p className="install-status" role="status">{installStatus}</p> : null}
          <Link className="app-more-link" href="/about">Tìm hiểu CineWave <ChevronRight size={15} /></Link>
        </div>
      </div>

      <div className="header-popover vip-popover">
        <button className="header-tool-button vip-trigger" type="button" aria-haspopup="dialog" onClick={() => setVipOpen(true)}>
          <Crown size={18} fill="currentColor" /><span>VIP</span><small>{viewer?.currentPlan ? "Đang hoạt động" : "Mở khóa"}</small>
        </button>
        <div className="header-dropdown vip-dropdown">
          <div className="vip-preview-heading"><span>Đặc quyền VIP</span><ChevronRight size={18} /></div>
          <div className="vip-preview-grid">
            <span><UsersRound size={18} /> Xem đến 4 thiết bị</span>
            <span><Zap size={18} /> 4K HDR</span>
            <span><Flame size={18} /> Premiere sớm</span>
            <span><ShieldCheck size={18} /> Không quảng cáo</span>
          </div>
          <button className="vip-join-button" type="button" onClick={() => setVipOpen(true)}>{viewer?.currentPlan ? "Quản lý gói VIP" : "Tham gia VIP"}</button>
          <Link className="vip-voucher-link" href="/rewards">Mã ưu đãi</Link>
        </div>
      </div>

      {vipOpen ? (
        <div className="vip-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setVipOpen(false); }}>
          <section className="vip-modal" role="dialog" aria-modal="true" aria-labelledby="vip-modal-title">
            <header className="vip-modal-header">
              <div className="vip-modal-user">
                <span className="vip-modal-avatar">{viewer ? viewer.profileName.slice(0, 1).toUpperCase() : <Play size={18} fill="currentColor" />}</span>
                <div><strong id="vip-modal-title">Chọn trải nghiệm CineWave</strong><p>{viewer ? `Nâng cấp cho hồ sơ ${viewer.profileName}` : "Đăng nhập khi bạn tiếp tục thanh toán"}</p></div>
              </div>
              <div className="vip-modal-quicklinks"><Link href="/rewards">Nhập mã ưu đãi</Link><button type="button" onClick={() => setVipOpen(false)} aria-label="Đóng"><X size={22} /></button></div>
            </header>

            <div className="vip-modal-body">
              <div className="vip-plan-tabs" role="tablist" aria-label="Chọn gói VIP">
                {membershipPlans.map((plan) => (
                  <button
                    key={plan.code}
                    className={selectedPlan === plan.code ? "is-selected" : ""}
                    type="button"
                    role="tab"
                    aria-selected={selectedPlan === plan.code}
                    onClick={() => setSelectedPlan(plan.code)}
                  >
                    <span>{plan.name}</span><small>{plan.quality}</small>
                  </button>
                ))}
              </div>

              <div className="vip-plan-picker">
                {membershipPlans.map((plan) => {
                  const detail = planDetails[plan.code];
                  const selected = selectedPlan === plan.code;
                  return (
                    <button
                      className={`vip-plan-option ${selected ? "is-selected" : ""}`}
                      style={{ "--plan-accent": detail.accent } as React.CSSProperties}
                      key={plan.code}
                      data-plan={plan.code}
                      type="button"
                      onClick={() => setSelectedPlan(plan.code)}
                    >
                      {detail.badge ? <span className="vip-plan-badge">{detail.badge}</span> : null}
                      <span className="vip-plan-radio">{selected ? <Check size={14} /> : null}</span>
                      <strong>{plan.name}</strong>
                      <b>{formatVnd(plan.amountVnd)}<small>/tháng</small></b>
                      <span>{plan.note}</span>
                    </button>
                  );
                })}
              </div>

              <div className="vip-benefit-strip" data-no-translate>
                <div><Sparkles size={18} /><span><small>Quyền lợi của {chosenPlan.name}</small><strong>{chosenPlan.quality} · {chosenPlan.streams} thiết bị</strong></span></div>
                {planDetails[chosenPlan.code].benefits.map((benefit) => <span key={benefit}><Check size={15} />{benefit}</span>)}
              </div>

              <div className="vip-payment-method">
                <h3>Phương thức thanh toán</h3>
                <button className="is-selected" type="button"><span className="vietqr-mark">VietQR</span><span><strong>Chuyển khoản ngân hàng</strong><small>QR riêng, đối soát tự động qua SePay</small></span><Check size={18} /></button>
              </div>
            </div>

            <footer className="vip-modal-footer" data-no-translate>
              <label><input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} /> Tôi đồng ý với <Link href="/about">điều khoản dịch vụ VIP</Link></label>
              {viewer ? (
                <form action={createPaymentInvoiceAction}>
                  <input type="hidden" name="planCode" value={chosenPlan.code} />
                  <span>{formatVnd(chosenPlan.amountVnd)}</span>
                  <button type="submit" disabled={!agreed || viewer.currentPlan === chosenPlan.code}>
                    {viewer.currentPlan === chosenPlan.code ? "Đây là gói hiện tại" : "Tạo QR và tham gia VIP"}<ChevronRight size={19} />
                  </button>
                </form>
              ) : (
                <div className="vip-login-action"><span>{formatVnd(chosenPlan.amountVnd)}</span><Link href={`/login?return_to=${encodeURIComponent("/plans")}`}>Đăng nhập để tiếp tục <ChevronRight size={19} /></Link></div>
              )}
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

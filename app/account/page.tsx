import Link from "next/link";
import Image from "next/image";
import { updatePrivacyAction } from "../actions/privacy";
import { logoutAction, revokeOtherSessionsAction, revokeSessionAction } from "../actions/auth";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { currentSessionHash, requireUser } from "../auth";
import { countActiveAuthSessions, ensureViewer, getAccountStats, getActiveProfile, getAnalyticsConsent, getSubscription, isAdmin, listAuthSessions, type AuthSessionInfo } from "@/db/runtime";
import { LocaleSwitcher } from "../components/LocaleSwitcher";
import { getCurrentLocale } from "../i18n/server";

export const dynamic = "force-dynamic";

function deviceName(userAgent: string | null) {
  if (!userAgent) return "Thiết bị không xác định";
  const os = /Android/i.test(userAgent) ? "Android" : /iPhone|iPad/i.test(userAgent) ? "iPhone/iPad" : /Windows/i.test(userAgent) ? "Windows" : /Mac OS/i.test(userAgent) ? "macOS" : /Linux/i.test(userAgent) ? "Linux" : "Thiết bị";
  const browser = /Edg\//i.test(userAgent) ? "Edge" : /Firefox\//i.test(userAgent) ? "Firefox" : /Chrome\//i.test(userAgent) ? "Chrome" : /Safari\//i.test(userAgent) ? "Safari" : "Trình duyệt";
  return `${browser} trên ${os}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

export default async function AccountPage() {
  const locale = await getCurrentLocale();
  const user = await requireUser("/account");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  const [stats, subscription, activeSessions, sessionsResult, currentHash, admin, analyticsConsent] = await Promise.all([
    getAccountStats(viewer.id, profile.id), getSubscription(viewer.id), countActiveAuthSessions(viewer.id), listAuthSessions(viewer.id), currentSessionHash(), isAdmin(viewer.id, user.email), getAnalyticsConsent(viewer.id),
  ]);

  const sessions = sessionsResult as AuthSessionInfo[];
  return <main><SiteHeader /><section className="settings-page page-shell">
    <div className="settings-heading"><div><p className="eyebrow">TÀI KHOẢN CINEWAVE</p><h1>Chào, {user.displayName}</h1><p>Quản lý hồ sơ, bảo mật và trải nghiệm cá nhân của bạn.</p></div><span className="plan-pill">{subscription?.planCode ?? "Preview"} · {profile.name}</span></div>
    <section className="settings-panel account-identity">
      <div className="account-avatar" style={{ background: profile.avatarColor }}>{profile.avatarUrl ? <Image src={profile.avatarUrl} alt={`Ảnh đại diện ${profile.name}`} width={76} height={76} unoptimized /> : profile.name.slice(0, 1).toUpperCase()}</div>
      <div><p className="eyebrow">THÔNG TIN TÀI KHOẢN</p><h2>{user.displayName}</h2><p>{user.email} · Đã xác thực</p></div>
      <Link className="button button-secondary" href="/profiles">Đổi ảnh & phong cách</Link>
    </section>
    <section className="settings-panel language-panel"><div><p className="eyebrow">NGÔN NGỮ</p><h2>Ngôn ngữ hiển thị</h2><p>Lựa chọn được đồng bộ với hồ sơ đang dùng.</p></div><LocaleSwitcher locale={locale} /></section>
    <form className="settings-panel privacy-panel" action={updatePrivacyAction}><div><p className="eyebrow">RIÊNG TƯ</p><h2>Dữ liệu cải thiện trải nghiệm</h2><p>Bạn quyết định có cho phép phân tích hành vi để cải thiện đề xuất hay không.</p></div><label className="checkbox-row"><input name="analyticsConsent" type="checkbox" defaultChecked={analyticsConsent} /> Cho phép analytics cá nhân hóa</label><button className="button button-secondary" type="submit">Lưu lựa chọn</button></form>
    <div className="account-stats"><article><strong>{stats.profiles}</strong><span>Hồ sơ</span></article><article><strong>{stats.saved}</strong><span>Phim đã lưu</span></article><article><strong>{stats.progress}</strong><span>Đang xem</span></article></div>
    <div className="settings-layout"><section className="settings-panel action-list"><p className="eyebrow">TIỆN ÍCH</p><h2>Trải nghiệm của bạn</h2><Link href="/profiles"><span>Hồ sơ & phong cách màu</span><span>→</span></Link><Link href="/my-list"><span>Danh sách của tôi</span><span>→</span></Link><Link href="/history"><span>Lịch sử xem</span><span>→</span></Link><Link href="/plans"><span>Gói thành viên</span><span>→</span></Link>{admin ? <Link href="/admin"><span>Không gian vận hành</span><span>→</span></Link> : null}</section></div>
    <section className="settings-panel security-devices"><div className="security-heading"><div><p className="eyebrow">BẢO MẬT & LỊCH SỬ TRUY CẬP</p><h2>{activeSessions} thiết bị đang đăng nhập</h2><p>Kiểm tra thời gian hoạt động và đăng xuất thiết bị bạn không nhận ra.</p></div>{sessions.length > 1 ? <form action={revokeOtherSessionsAction}><button className="button button-secondary" type="submit">Đăng xuất tất cả thiết bị khác</button></form> : null}</div>
      <div className="device-list">{sessions.map((session) => { const current = session.tokenHash === currentHash; return <article key={session.id} className={current ? "is-current" : ""}><span className="device-icon">{current ? "●" : "○"}</span><div><strong>{deviceName(session.userAgent)} {current ? <em>Thiết bị này</em> : null}</strong><small>Hoạt động: {formatTime(session.lastSeenAt)} · Đăng nhập: {formatTime(session.createdAt)}{session.ipAddress ? ` · IP ${session.ipAddress}` : ""}</small></div>{current ? <span className="status-badge status-live">Đang dùng</span> : <form action={revokeSessionAction}><input type="hidden" name="sessionId" value={session.id} /><button className="device-logout" type="submit">Đăng xuất</button></form>}</article>; })}</div>
    </section>
    <form action={logoutAction}><button className="button button-secondary" type="submit">Đăng xuất thiết bị này</button></form>
  </section><Footer /></main>;
}

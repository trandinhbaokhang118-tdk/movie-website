import Link from "next/link";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { chatGPTSignOutPath, requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer, getAccountStats } from "@/db/runtime";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requireChatGPTUser("/account");
  const viewer = await ensureViewer(user.email, user.displayName);
  const stats = await getAccountStats(viewer.id);

  return (
    <main>
      <SiteHeader />
      <section className="settings-page page-shell">
        <div className="settings-heading">
          <div><p className="eyebrow">TÀI KHOẢN CINEWAVE</p><h1>Chào, {user.displayName}</h1><p>Quản lý trải nghiệm xem và dữ liệu của bạn.</p></div>
          <span className="plan-pill">CineWave Preview</span>
        </div>
        <div className="account-stats">
          <article><strong>{stats.profiles}</strong><span>Hồ sơ</span></article>
          <article><strong>{stats.saved}</strong><span>Phim đã lưu</span></article>
          <article><strong>{stats.progress}</strong><span>Đang xem</span></article>
        </div>
        <div className="settings-layout">
          <section className="settings-panel">
            <p className="eyebrow">THÔNG TIN</p>
            <h2>Tài khoản</h2>
            <dl className="account-details"><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Trạng thái</dt><dd><span className="status-badge status-live">Đã xác thực</span></dd></div></dl>
          </section>
          <section className="settings-panel action-list">
            <p className="eyebrow">CÀI ĐẶT</p>
            <h2>Trải nghiệm xem</h2>
            <Link href="/profiles"><span>Quản lý hồ sơ</span><span>→</span></Link>
            <Link href="/my-list"><span>Danh sách của tôi</span><span>→</span></Link>
            <Link href="/admin"><span>Không gian vận hành</span><span>→</span></Link>
          </section>
        </div>
        <Link className="button button-secondary" href={chatGPTSignOutPath("/")}>Đăng xuất</Link>
      </section>
      <Footer />
    </main>
  );
}

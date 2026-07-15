import Link from "next/link";
import { createProfileAction } from "../actions/profiles";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer, listProfiles } from "@/db/runtime";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await requireChatGPTUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profiles = await listProfiles(viewer.id);

  return (
    <main>
      <SiteHeader />
      <section className="settings-page page-shell">
        <div className="settings-heading">
          <div><p className="eyebrow">HỒ SƠ NGƯỜI XEM</p><h1>Ai đang xem?</h1><p>Mỗi hồ sơ có danh sách và đề xuất riêng.</p></div>
          <Link className="text-link" href="/account">Quay lại tài khoản →</Link>
        </div>
        <div className="profiles-grid">
          {profiles.map((profile) => (
            <article className="profile-card" key={profile.id}>
              <div className="profile-avatar" style={{ background: profile.avatarColor }}>
                {profile.isKids ? "K" : profile.name.slice(0, 1).toUpperCase()}
              </div>
              <h2>{profile.name}</h2>
              <p>{profile.isKids ? "Hồ sơ trẻ em" : `Nội dung đến ${profile.maturity}`}</p>
              <span className="status-badge status-live">Đang hoạt động</span>
            </article>
          ))}
        </div>
        {profiles.length < 5 && (
          <form className="settings-panel profile-form" action={createProfileAction}>
            <div><p className="eyebrow">THÊM HỒ SƠ</p><h2>Tạo không gian riêng</h2></div>
            <label>Tên hồ sơ<input name="name" required minLength={2} maxLength={30} placeholder="Ví dụ: Minh" /></label>
            <label className="checkbox-row"><input name="isKids" type="checkbox" /> Đây là hồ sơ trẻ em</label>
            <button className="button button-primary" type="submit">Tạo hồ sơ</button>
          </form>
        )}
      </section>
      <Footer />
    </main>
  );
}

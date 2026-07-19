import Link from "next/link";
import { createProfileAction, selectProfileAction, updateProfileAction } from "../actions/profiles";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer, getActiveProfile, listProfiles } from "@/db/runtime";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await requireChatGPTUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profiles = await listProfiles(viewer.id);
  const activeProfile = await getActiveProfile(viewer.id);

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
              <form action={selectProfileAction}>
                <input type="hidden" name="profileId" value={profile.id} />
                <button className="button button-secondary" type="submit" disabled={activeProfile.id === profile.id}>
                  {activeProfile.id === profile.id ? "Đang sử dụng" : "Chuyển hồ sơ"}
                </button>
              </form>
              <details className="profile-settings">
                <summary>Tùy chỉnh trải nghiệm</summary>
                <form action={updateProfileAction}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <label>Giới hạn độ tuổi<select name="maturity" defaultValue={profile.maturity}><option value="P">Mọi lứa tuổi</option><option value="K">7+</option><option value="T13">13+</option><option value="T16">16+</option><option value="T18">18+</option></select></label>
                  <label>Phụ đề mặc định<select name="subtitleLanguage" defaultValue="vi"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="off">Tắt</option></select></label>
                  <label className="checkbox-row"><input name="autoplayNext" type="checkbox" defaultChecked /> Tự phát tập tiếp</label>
                  <label className="checkbox-row"><input name="autoplayPreviews" type="checkbox" /> Tự phát bản xem trước</label>
                  <button className="button button-secondary" type="submit">Lưu cài đặt</button>
                </form>
              </details>
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

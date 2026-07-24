import Link from "next/link";
import Image from "next/image";
import { createProfileAction, selectProfileAction, updateProfileAction, updateProfileAppearanceAction } from "../actions/profiles";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { requireUser } from "../auth";
import { ensureViewer, getActiveProfile, listProfiles } from "@/db/runtime";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const user = await requireUser("/profiles");
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
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt={`Ảnh đại diện ${profile.name}`} width={120} height={120} unoptimized /> : profile.isKids ? "K" : profile.name.slice(0, 1).toUpperCase()}
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
              <details className="profile-settings">
                <summary>Ảnh đại diện & màu chủ đạo</summary>
                <form action={updateProfileAppearanceAction}>
                  <input type="hidden" name="profileId" value={profile.id} />
                  <input type="hidden" name="currentAvatarUrl" value={profile.avatarUrl ?? ""} />
                  <label>Chọn ảnh đại diện<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label>
                  <small>PNG, JPG, WebP hoặc GIF; tối đa 500 KB.</small>
                  {profile.avatarUrl ? <label className="checkbox-row"><input name="removeAvatar" type="checkbox" /> Xóa ảnh hiện tại</label> : null}
                  <label>Màu avatar<input name="avatarColor" type="color" defaultValue={profile.avatarColor} /></label>
                  <label>Phong cách màu<select name="theme" defaultValue={profile.theme}>
                    <option value="cinewave">CineWave tím đêm</option><option value="water">Mệnh Thủy · Đại dương xanh ngọc</option>
                    <option value="wood">Mệnh Mộc · Rừng xanh</option><option value="fire">Mệnh Hỏa · Đỏ san hô</option>
                    <option value="earth">Mệnh Thổ · Hổ phách</option><option value="metal">Mệnh Kim · Bạc ánh trăng</option>
                  </select></label>
                  <button className="button button-primary" type="submit">Áp dụng phong cách</button>
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

import { createEditorialAction, setEditorialStatusAction } from "@/app/actions/admin";
import { listEditorialContents } from "@/db/runtime";
import { AdminPageHead } from "../AdminPageHead";
import { requireAdminCapability } from "../access";

export default async function SchedulePage() {
  await requireAdminCapability("content");
  const programs = await listEditorialContents("program");
  return <div className="admin-dashboard">
    <AdminPageHead eyebrow="PHÁT HÀNH" title="Đăng chương trình" description="Tạo chương trình, tập phát sóng và quản lý lịch công chiếu."/>
    <details className="admin-create-v2" open>
      <summary>+ Tạo chương trình mới</summary>
      <form action={createEditorialAction} className="admin-form-v2">
        <input type="hidden" name="kind" value="program"/>
        <div>
          <label className="wide">Tên chương trình<input name="title" required maxLength={160}/></label>
          <label>Đường dẫn tùy chỉnh<input name="slug" placeholder="inside-cinema-tap-12"/></label>
          <label>Định dạng<input name="category" required placeholder="Talkshow, Livestream, Sự kiện..."/></label>
          <label className="wide">Giới thiệu ngắn<textarea name="excerpt" rows={2} required maxLength={320}/></label>
          <label className="wide">Kịch bản / mô tả chương trình<textarea name="body" rows={7} required maxLength={12000}/></label>
          <label>Ảnh bìa URL<input name="coverUrl" type="url" placeholder="https://..."/></label>
          <label>Video / livestream URL<input name="mediaUrl" placeholder="/media/show.mp4 hoặc https://..."/></label>
          <label>Thời gian phát sóng<input name="scheduledAt" type="datetime-local" required/></label>
        </div>
        <button className="admin-primary-button">Lưu chương trình</button>
      </form>
    </details>
    <section className="admin-panel admin-editorial-list">{programs.length ? programs.map(item => <article key={item.id}>
      <time>{item.scheduledAt ? new Date(item.scheduledAt).toLocaleString("vi-VN") : "Chưa xếp lịch"}</time>
      <div><span className={`title-status ${item.status}`}>{item.status === "published" ? "Đang phát hành" : item.status === "scheduled" ? "Đã lên lịch" : item.status === "hidden" ? "Đã ẩn" : "Bản nháp"}</span><h3>{item.title}</h3><p>{item.category}</p></div>
      <form action={setEditorialStatusAction}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value={item.status === "published" ? "hidden" : "published"}/><button>{item.status === "published" ? "Ẩn" : "Xuất bản"}</button></form>
    </article>) : <p className="admin-empty">Chưa có chương trình nào trong lịch.</p>}</section>
  </div>;
}

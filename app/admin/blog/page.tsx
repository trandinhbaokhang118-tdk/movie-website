import { createEditorialAction, setEditorialStatusAction } from "@/app/actions/admin";
import { listEditorialContents } from "@/db/runtime";
import { AdminPageHead } from "../AdminPageHead";
import { requireAdminCapability } from "../access";

export default async function BlogPage() {
  await requireAdminCapability("content");
  const posts = await listEditorialContents("blog");
  return <div className="admin-dashboard">
    <AdminPageHead eyebrow="EDITORIAL" title="Đăng bài blog" description="Soạn thảo, lên lịch và xuất bản tin tức CineWave."/>
    <details className="admin-create-v2" open>
      <summary>+ Viết bài mới</summary>
      <form action={createEditorialAction} className="admin-form-v2">
        <input type="hidden" name="kind" value="blog"/>
        <div>
          <label className="wide">Tiêu đề<input name="title" required maxLength={160}/></label>
          <label>Đường dẫn tùy chỉnh<input name="slug" placeholder="tu-dong-tao-theo-tieu-de"/></label>
          <label>Chuyên mục<input name="category" required placeholder="Tin mới, Hậu trường..."/></label>
          <label className="wide">Mô tả ngắn<textarea name="excerpt" rows={2} required maxLength={320}/></label>
          <label className="wide">Nội dung bài viết<textarea name="body" rows={10} required maxLength={12000}/></label>
          <label>Ảnh bìa URL<input name="coverUrl" type="url" placeholder="https://..."/></label>
          <label>Hẹn giờ đăng<input name="scheduledAt" type="datetime-local"/></label>
        </div>
        <button className="admin-primary-button">Lưu bài viết</button>
      </form>
    </details>
    <EditorialList items={posts}/>
  </div>;
}

function EditorialList({ items }: { items: Awaited<ReturnType<typeof listEditorialContents>> }) {
  return <section className="admin-panel admin-editorial-list">{items.length ? items.map(item => <article key={item.id}>
    <div><span className={`title-status ${item.status}`}>{label(item.status)}</span><h3>{item.title}</h3><p>{item.category} · {new Date(item.updatedAt).toLocaleDateString("vi-VN")}</p></div>
    <form action={setEditorialStatusAction}><input type="hidden" name="id" value={item.id}/><input type="hidden" name="status" value={item.status === "published" ? "hidden" : "published"}/><button>{item.status === "published" ? "Ẩn bài" : "Xuất bản"}</button></form>
  </article>) : <p className="admin-empty">Chưa có bài viết. Hãy tạo bài đầu tiên ở biểu mẫu phía trên.</p>}</section>;
}
function label(status: string) { return status === "published" ? "Đã xuất bản" : status === "scheduled" ? "Đã lên lịch" : status === "hidden" ? "Đã ẩn" : "Bản nháp"; }

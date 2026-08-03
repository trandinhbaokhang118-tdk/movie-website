import { createTitleAction, deleteTitleAction, setTitleStatusAction } from "@/app/actions/admin";
import { getImportedCatalogStats, listManagedTitles } from "@/db/runtime";
import { CatalogSyncButton } from "../../components/CatalogSyncButton";
import { AdminPageHead } from "../AdminPageHead";
import { requireAdminCapability } from "../access";

export default async function ContentPage() {
  await requireAdminCapability("content");
  const [stats, titles] = await Promise.all([getImportedCatalogStats(), listManagedTitles()]);
  return <div className="admin-dashboard">
    <AdminPageHead eyebrow="CONTENT STUDIO" title="Đăng phim & series" description={`${titles.length} nội dung CMS · ${stats.movies} metadata tham khảo`}/>
    <details className="admin-create-v2" open>
      <summary>+ Tạo phim hoặc series mới</summary>
      <form action={createTitleAction} className="admin-form-v2">
        <div>
          <label>Tên hiển thị<input name="title" required maxLength={120}/></label>
          <label>Tên gốc<input name="originalTitle" required maxLength={120}/></label>
          <label>Năm phát hành<input name="releaseYear" type="number" min="1888" max="2031" defaultValue="2026" required/></label>
          <label>Loại nội dung<select name="contentType"><option value="movie">Phim lẻ</option><option value="series">Series</option></select></label>
          <label>Thể loại<input name="genres" placeholder="Tâm lý, Hành động" required/></label>
          <label>Phân loại<select name="maturity"><option>P</option><option>K</option><option>T13</option><option>T16</option><option>T18</option></select></label>
          <label>Thời lượng<input name="duration" placeholder="118 phút hoặc 8 tập" required/></label>
          <label>Poster URL<input name="posterUrl" type="url" placeholder="https://..."/></label>
          <label>Tải poster lên R2<input name="posterFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif"/></label>
          <label className="wide">Media URL<input name="videoUrl" placeholder="/media/phim.mp4 hoặc https://..."/></label>
          <label className="wide">Tải video lên R2 (tối đa 95 MB)<input name="videoFile" type="file" accept="video/mp4,video/webm,application/vnd.apple.mpegurl"/></label>
          <label>Phụ đề WebVTT URL<input name="subtitleUrl" type="url" placeholder="https://.../vi.vtt"/></label>
          <label>Tải phụ đề WebVTT<input name="subtitleFile" type="file" accept="text/vtt,.vtt"/></label>
          <label>Tên giấy phép<input name="licenseName" required placeholder="Creative Commons / Hợp đồng..."/></label>
          <label>URL giấy phép<input name="licenseUrl" type="url" required placeholder="https://..."/></label>
          <label className="wide">Mô tả<textarea name="synopsis" rows={5} required maxLength={2000}/></label>
        </div>
        <button className="admin-primary-button">Lưu bản nháp phim</button>
      </form>
    </details>
    <div className="admin-title-list">{titles.map((title) => <article className="managed-title-v2" key={title.id}>
      <header><div><span className={`title-status ${title.status}`}>{title.status === "published" ? "Đã xuất bản" : title.status === "scheduled" ? "Sắp ra mắt" : title.status === "hidden" ? "Đã ẩn" : "Bản nháp"}</span><h3>{title.title}</h3><p>{title.releaseYear} · {title.contentType} · {title.genres}{title.scheduledAt ? ` · Mở lúc ${new Date(title.scheduledAt).toLocaleString("vi-VN")}` : ""}</p></div>
        <div className="admin-inline-actions">
          {title.status !== "published" && <form action={setTitleStatusAction}><input type="hidden" name="id" value={title.id}/><input type="hidden" name="status" value="published"/><button>Xuất bản</button></form>}
          {title.status !== "published" && <form action={setTitleStatusAction}><input type="hidden" name="id" value={title.id}/><input type="hidden" name="status" value="scheduled"/><input name="scheduledAt" type="datetime-local" required/><button>Hẹn ngày ra mắt</button></form>}
          {title.status === "published" && <form action={setTitleStatusAction}><input type="hidden" name="id" value={title.id}/><input type="hidden" name="status" value="hidden"/><button>Ẩn phim</button></form>}
          {title.status !== "published" && <form action={deleteTitleAction}><input type="hidden" name="id" value={title.id}/><label><span className="sr-only">Nhập DELETE để xóa {title.title}</span><input name="confirmation" aria-label={`Nhập DELETE để xóa ${title.title}`} placeholder="DELETE" required pattern="DELETE"/></label><button>Xóa vĩnh viễn</button></form>}
        </div>
      </header>
    </article>)}</div>
    <div className="admin-sync"><CatalogSyncButton/></div>
  </div>;
}

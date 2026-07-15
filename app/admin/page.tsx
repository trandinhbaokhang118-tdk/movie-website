import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer } from "@/db/runtime";
import { movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  await ensureViewer(user.email, user.displayName);
  const seriesCount = movies.filter((movie) => movie.series).length;

  return (
    <main className="admin-page">
      <SiteHeader />
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <p className="eyebrow">VẬN HÀNH</p>
          <nav aria-label="Quản trị"><Link className="is-active" href="/admin">Tổng quan</Link><a href="#catalog">Nội dung</a><a href="#rights">Quyền phát</a><a href="#activity">Hoạt động</a></nav>
          <p className="admin-user">Đăng nhập: {user.email}</p>
        </aside>
        <section className="admin-content">
          <div className="settings-heading"><div><p className="eyebrow">CONTROL ROOM</p><h1>Tổng quan nội dung</h1><p>Theo dõi catalog demo và trạng thái phát hành.</p></div><span className="status-badge status-live">Hệ thống ổn định</span></div>
          <div className="admin-metrics"><article><p>Tựa phim</p><strong>{movies.length}</strong><span>100% đã kiểm duyệt</span></article><article><p>Series</p><strong>{seriesCount}</strong><span>14 tập sẵn sàng</span></article><article><p>Quyền phát</p><strong>100%</strong><span>Không có cảnh báo</span></article><article><p>Playback</p><strong>99.9%</strong><span>Demo health target</span></article></div>
          <section className="admin-table-wrap" id="catalog">
            <div className="catalog-heading"><h2>Catalog đang phát hành</h2><Link className="text-link" href="/browse">Xem trên storefront →</Link></div>
            <div className="admin-table" role="table" aria-label="Catalog">
              <div className="admin-row admin-row-head" role="row"><span>Tựa phim</span><span>Loại</span><span>Phân loại</span><span>Trạng thái</span></div>
              {movies.slice(0, 8).map((movie) => <div className="admin-row" role="row" key={movie.id}><span><strong>{movie.title}</strong><small>{movie.year}</small></span><span>{movie.series ? "Series" : "Phim lẻ"}</span><span>{movie.maturity}</span><span><i className="status-dot" /> Published</span></div>)}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

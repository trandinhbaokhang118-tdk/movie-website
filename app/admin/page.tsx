import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../components/SiteHeader";
import { CatalogSyncButton } from "../components/CatalogSyncButton";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer, getImportedCatalogStats, isAdmin } from "@/db/runtime";
import { movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  if (!(await isAdmin(viewer.id, user.email))) notFound();
  const imported = await getImportedCatalogStats();
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
          <div className="admin-metrics"><article><p>Tựa phim demo</p><strong>{movies.length}</strong><span>Catalog nội bộ</span></article><article><p>Metadata đã nhập</p><strong>{imported.movies}</strong><span>{imported.trailers} trailer khả dụng</span></article><article><p>Series</p><strong>{seriesCount}</strong><span>Catalog demo</span></article><article><p>Nguồn nhập</p><strong>TMDB</strong><span>Metadata và trailer được cấp phép</span></article></div>
          <CatalogSyncButton />
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

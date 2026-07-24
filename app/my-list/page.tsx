import Link from "next/link";
import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { requireUser } from "../auth";
import { ensureViewer, getActiveProfile, listWatchlist } from "@/db/runtime";
import { movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function MyListPage() {
  const user = await requireUser("/my-list");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  const ids = await listWatchlist(viewer.id, profile.id);
  const saved = ids.map((id) => movies.find((movie) => movie.id === id)).filter(Boolean);

  return (
    <main>
      <SiteHeader />
      <section className="library-page page-shell">
        <p className="eyebrow">THƯ VIỆN CÁ NHÂN</p>
        <h1>Tủ phim của tôi</h1>
        <p>Hàng đợi cá nhân cho những câu chuyện bạn muốn xem tiếp, được đồng bộ an toàn với tài khoản.</p>
        {saved.length ? (
          <div className="catalog-grid personal-grid">
            {saved.map((movie) => movie && <MediaCard key={movie.id} movie={movie} initialSaved />)}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">＋</span>
            <h2>Tủ phim của bạn đang trống</h2>
            <p>Chạm biểu tượng lưu trên poster để thêm phim vào hàng đợi.</p>
            <Link className="button button-primary" href="/browse">Khám phá thư viện</Link>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

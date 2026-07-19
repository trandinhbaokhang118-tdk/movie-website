import Link from "next/link";
import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { requireChatGPTUser } from "../chatgpt-auth";
import { ensureViewer, getActiveProfile, listWatchlist } from "@/db/runtime";
import { movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function MyListPage() {
  const user = await requireChatGPTUser("/my-list");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  const ids = await listWatchlist(viewer.id, profile.id);
  const saved = ids.map((id) => movies.find((movie) => movie.id === id)).filter(Boolean);

  return (
    <main>
      <SiteHeader />
      <section className="library-page page-shell">
        <p className="eyebrow">THƯ VIỆN CÁ NHÂN</p>
        <h1>Danh sách của tôi</h1>
        <p>Những câu chuyện bạn muốn quay lại, được đồng bộ an toàn với tài khoản.</p>
        {saved.length ? (
          <div className="catalog-grid personal-grid">
            {saved.map((movie) => movie && <MediaCard key={movie.id} movie={movie} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">＋</span>
            <h2>Danh sách của bạn đang trống</h2>
            <p>Thêm phim từ trang chi tiết để xem lại bất cứ lúc nào.</p>
            <Link className="button button-primary" href="/browse">Khám phá thư viện</Link>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

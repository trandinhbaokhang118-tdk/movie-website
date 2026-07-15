import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { searchMovies } from "@/lib/catalog";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchMovies(q);

  return (
    <main>
      <SiteHeader />
      <section className="search-page page-shell">
        <p className="eyebrow">TÌM KIẾM</p>
        <h1>Tìm câu chuyện tiếp theo</h1>
        <form className="search-form" action="/search">
          <label htmlFor="movie-search" className="sr-only">Tên phim, diễn viên hoặc thể loại</label>
          <span aria-hidden="true">⌕</span>
          <input
            id="movie-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Tên phim, diễn viên hoặc thể loại..."
            autoFocus
          />
          <button className="button button-primary" type="submit">Tìm kiếm</button>
        </form>
        {q ? (
          <div className="search-summary">
            <h2>Kết quả cho “{q}”</h2>
            <p>{results.length} kết quả</p>
          </div>
        ) : (
          <div className="search-summary">
            <h2>Được tìm nhiều</h2>
            <p>Khám phá toàn bộ tuyển chọn</p>
          </div>
        )}
        {results.length ? (
          <div className="catalog-grid">
            {results.map((movie, index) => (
              <MediaCard key={movie.id} movie={movie} priority={index < 5} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h2>Chưa tìm thấy tựa phim phù hợp</h2>
            <p>Thử tên ngắn hơn, tên diễn viên hoặc một thể loại khác.</p>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

import { Footer } from "../components/Footer";
import { ImportedCatalog } from "../components/ImportedCatalog";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { searchImportedMovies } from "@/db/runtime";
import { searchMovies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const [curatedResults, importedResults] = await Promise.all([
    Promise.resolve(searchMovies(q)),
    searchImportedMovies(q, 40),
  ]);
  const total = curatedResults.length + importedResults.length;

  return (
    <main>
      <SiteHeader />
      <section className="search-page page-shell">
        <p className="eyebrow">TÌM KIẾM TOÀN BỘ CATALOG</p>
        <h1>Tìm câu chuyện tiếp theo</h1>
        <form className="search-form" action="/search">
          <label htmlFor="movie-search" className="sr-only">Tên phim hoặc nội dung mô tả</label>
          <span aria-hidden="true">⌕</span>
          <input id="movie-search" name="q" type="search" defaultValue={q} placeholder="Tên phim hoặc nội dung mô tả..." autoFocus />
          <button className="button button-primary" type="submit">Tìm kiếm</button>
        </form>
        <div className="search-summary">
          <h2>{q ? `Kết quả cho “${q}”` : "Được tìm nhiều"}</h2>
          <p>{total} kết quả</p>
        </div>
        {total > 0 ? (
          <div className="search-result-groups">
            {curatedResults.length > 0 ? (
              <section>
                <div className="catalog-heading"><h2>CineWave tuyển chọn</h2><p>{curatedResults.length} tựa phim</p></div>
                <div className="catalog-grid">{curatedResults.map((movie, index) => <MediaCard key={movie.id} movie={movie} priority={index < 5} />)}</div>
              </section>
            ) : null}
            {importedResults.length > 0 ? (
              <section>
                <div className="catalog-heading"><h2>Phim và trailer từ TMDB</h2><p>{importedResults.length} tựa phim</p></div>
                <ImportedCatalog movies={importedResults} priorityCount={curatedResults.length ? 0 : 5} />
              </section>
            ) : null}
          </div>
        ) : (
          <div className="empty-state"><span aria-hidden="true">⌕</span><h2>Chưa tìm thấy tựa phim phù hợp</h2><p>Thử tên ngắn hơn hoặc một từ khóa khác.</p></div>
        )}
      </section>
      <Footer />
    </main>
  );
}

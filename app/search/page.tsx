import { Footer } from "../components/Footer";
import { ImportedCatalog } from "../components/ImportedCatalog";
import { MediaCard } from "../components/MediaCard";
import { ManagedTitleCard } from "../components/ManagedTitleCard";
import { SiteHeader } from "../components/SiteHeader";
import { listManagedTitles, listWatchlist, recordAnalytics, searchImportedMovies } from "@/db/runtime";
import { searchMovies } from "@/lib/catalog";
import { maturityAllows } from "@/lib/catalog";
import { getViewerContext } from "../viewer-context";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const context = await getViewerContext();
  const [curatedResults, importedResults, managedResults, savedIds] = await Promise.all([
    Promise.resolve(searchMovies(q).filter((movie) => maturityAllows(movie, context?.profile.maturity ?? "T18"))),
    context?.profile.isKids ? Promise.resolve([]) : searchImportedMovies(q, 40),
    listManagedTitles({ publishedOnly: true, query: q }),
    context ? listWatchlist(context.viewer.id, context.profile.id) : Promise.resolve([]),
  ]);
  const total = curatedResults.length + importedResults.length + managedResults.length;
  if (q.trim()) {
    await recordAnalytics(context?.profile.id ?? null, "search.submitted", {
      query: q.trim(),
      resultIds: curatedResults.slice(0, 8).map((movie) => movie.id),
      resultCount: total,
    }, "essential");
  }

  return (
    <main>
      <SiteHeader initialSearchQuery={q} />
      <section className="search-page page-shell">
        <p className="eyebrow">TÌM KIẾM TOÀN BỘ CATALOG</p>
        <h1>Tìm câu chuyện tiếp theo</h1>
        <div className="search-summary">
          <h2>{q ? `Kết quả cho “${q}”` : "Được tìm nhiều"}</h2>
          <p>{total} kết quả</p>
        </div>
        {total > 0 ? (
          <div className="search-result-groups">
            {managedResults.length > 0 ? <section><div className="catalog-heading"><h2>CineWave vừa xuất bản</h2><p>{managedResults.length} tựa phim</p></div><div className="catalog-grid">{managedResults.map((title) => <ManagedTitleCard key={title.id} title={title} />)}</div></section> : null}
            {curatedResults.length > 0 ? (
              <section>
                <div className="catalog-heading"><h2>CineWave tuyển chọn</h2><p>{curatedResults.length} tựa phim</p></div>
                <div className="catalog-grid">{curatedResults.map((movie, index) => <MediaCard key={movie.id} movie={movie} priority={index < 5} initialSaved={savedIds.includes(movie.id)} />)}</div>
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

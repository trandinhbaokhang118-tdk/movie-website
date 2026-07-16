import Link from "next/link";
import { Footer } from "../components/Footer";
import { ImportedCatalog } from "../components/ImportedCatalog";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { listImportedMovies } from "@/db/runtime";
import { movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const genres = ["Tất cả", "Khoa học viễn tưởng", "Chính kịch", "Bí ẩn", "Tình cảm", "Tài liệu"];

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ genre?: string; type?: string }> }) {
  const { genre, type } = await searchParams;
  const selected = genre ?? "Tất cả";
  const filtered = movies.filter((movie) => {
    const genreMatches = selected === "Tất cả" || movie.genres.includes(selected);
    const typeMatches = type !== "series" || Boolean(movie.series);
    return genreMatches && typeMatches;
  });
  const imported = selected === "Tất cả" && type !== "series" ? await listImportedMovies(30) : [];

  return (
    <main>
      <SiteHeader />
      <section className="browse-hero page-shell">
        <p className="eyebrow">THƯ VIỆN CINEWAVE</p>
        <h1>{type === "series" ? "Series chọn lọc" : "Mọi câu chuyện, một điểm đến"}</h1>
        <p>Khám phá catalog CineWave và những tựa phim thế giới đang được quan tâm, kèm trailer chính thức khi khả dụng.</p>
      </section>
      <section className="page-shell catalog-section">
        <div className="filter-row" aria-label="Lọc theo thể loại">
          {genres.map((item) => (
            <Link key={item} className={`filter-chip ${selected === item ? "is-active" : ""}`} href={`/browse?genre=${encodeURIComponent(item)}${type ? `&type=${type}` : ""}`}>
              {item}
            </Link>
          ))}
        </div>
        <div className="catalog-heading"><h2>{selected}</h2><p>{filtered.length} tựa CineWave</p></div>
        <div className="catalog-grid">
          {filtered.map((movie, index) => <MediaCard key={movie.id} movie={movie} priority={index < 5} />)}
        </div>
        {imported.length > 0 ? (
          <section className="external-catalog-section">
            <div className="catalog-heading"><div><p className="eyebrow">CẬP NHẬT TỪ TMDB</p><h2>Phim thế giới đang được quan tâm</h2></div><p>{imported.length} tựa phim</p></div>
            <ImportedCatalog movies={imported} />
          </section>
        ) : null}
      </section>
      <Footer />
    </main>
  );
}

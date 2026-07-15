import Link from "next/link";
import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { movies } from "@/lib/catalog";

const genres = ["Tất cả", "Khoa học viễn tưởng", "Chính kịch", "Bí ẩn", "Tình cảm", "Tài liệu"];

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ genre?: string; type?: string }>;
}) {
  const { genre, type } = await searchParams;
  const selected = genre ?? "Tất cả";
  const filtered = movies.filter((movie) => {
    const genreMatches = selected === "Tất cả" || movie.genres.includes(selected);
    const typeMatches = type !== "series" || Boolean(movie.series);
    return genreMatches && typeMatches;
  });

  return (
    <main>
      <SiteHeader />
      <section className="browse-hero page-shell">
        <p className="eyebrow">THƯ VIỆN CINEWAVE</p>
        <h1>{type === "series" ? "Series chọn lọc" : "Mọi câu chuyện, một điểm đến"}</h1>
        <p>Khám phá những bộ phim nguyên bản và tuyển chọn theo tâm trạng của bạn.</p>
      </section>
      <section className="page-shell catalog-section">
        <div className="filter-row" aria-label="Lọc theo thể loại">
          {genres.map((item) => (
            <Link
              key={item}
              className={`filter-chip ${selected === item ? "is-active" : ""}`}
              href={`/browse?genre=${encodeURIComponent(item)}${type ? `&type=${type}` : ""}`}
            >
              {item}
            </Link>
          ))}
        </div>
        <div className="catalog-heading">
          <h2>{selected}</h2>
          <p>{filtered.length} tựa phim</p>
        </div>
        <div className="catalog-grid">
          {filtered.map((movie, index) => (
            <MediaCard key={movie.id} movie={movie} priority={index < 5} />
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { CinematicDepth } from "../components/CinematicDepth";
import { HeroPosterStage } from "../components/HeroPosterStage";
import { Footer } from "../components/Footer";
import { ImportedCatalog } from "../components/ImportedCatalog";
import { MediaCard } from "../components/MediaCard";
import { ManagedTitleCard } from "../components/ManagedTitleCard";
import { SiteHeader } from "../components/SiteHeader";
import { listImportedMovies, listManagedTitles, listWatchlist, maturityRatingAllows } from "@/db/runtime";
import { filterMoviesForMaturity, movies } from "@/lib/catalog";
import { getViewerContext } from "../viewer-context";

export const dynamic = "force-dynamic";

const allGenres = "Tất cả";
const genres = [allGenres, ...Array.from(new Set(movies.flatMap((movie) => movie.genres))).sort((a, b) => a.localeCompare(b, "vi"))];
const genreBento = [
  { label: "Hành động", query: "Hành động", icon: "↗", tone: "cyan" },
  { label: "Bí ẩn", query: "Bí ẩn", icon: "◌", tone: "violet" },
  { label: "Khoa học viễn tưởng", query: "Khoa học viễn tưởng", icon: "✦", tone: "blue" },
  { label: "Chính kịch", query: "Chính kịch", icon: "◇", tone: "rose" },
  { label: "Hoạt hình", query: "Hoạt hình", icon: "◎", tone: "amber" },
  { label: "Series", query: "Series", icon: "▦", tone: "mint" },
];

export default async function BrowsePage({ searchParams }: { searchParams: Promise<{ genre?: string; type?: string }> }) {
  const { genre, type } = await searchParams;
  const context = await getViewerContext();
  const visibleMovies = filterMoviesForMaturity(movies, context?.profile.maturity ?? "T18");
  const selected = genre ?? allGenres;
  const filtered = visibleMovies.filter((movie) => {
    const genreMatches = selected === allGenres || movie.genres.includes(selected);
    const typeMatches = type !== "series" || Boolean(movie.series);
    return genreMatches && typeMatches;
  });
  const featured = filtered.find((movie) => movie.id === "ia-sprite-fright-2021") ?? filtered.find((movie) => movie.featured) ?? filtered[0] ?? visibleMovies[0];
  const stageMovies = featured ? [
    featured,
    ...filtered.filter((movie) => movie.id === "ia-sintel" || movie.id === "ia-tears-of-steel"),
    ...filtered.filter((movie) => movie.id !== featured.id && movie.id !== "ia-sintel" && movie.id !== "ia-tears-of-steel"),
  ].slice(0, 3) : [];
  const [imported, managed, savedIds] = await Promise.all([
    !context?.profile.isKids && selected === allGenres && type !== "series" ? listImportedMovies(30) : Promise.resolve([]),
    listManagedTitles({ publishedOnly: true }),
    context ? listWatchlist(context.viewer.id, context.profile.id) : Promise.resolve([]),
  ]);
  const visibleManaged = managed.filter((title) =>
    maturityRatingAllows(title.maturity, context?.profile.maturity ?? "T18") &&
    (selected === allGenres || title.genres.split(",").map((item) => item.trim()).includes(selected)) &&
    (type !== "series" || title.contentType === "series"),
  );

  return (
    <main className="browse-home">
      <SiteHeader />
      {featured ? (
        <section className="browse-cinema-hero" style={{ "--hero-accent": featured.accent } as React.CSSProperties}>
          <Image className="browse-cinema-backdrop" src={featured.backdrop} alt="" fill priority sizes="100vw" />
          <div className="browse-cinema-scrim" />
          <CinematicDepth accent={featured.accent} />
          <div className="page-shell browse-cinema-layout">
            <div className="browse-cinema-copy">
              <p className="hero-kicker"><span>CINEWAVE</span> ĐÊM NAY XEM GÌ?</p>
              <h1>{featured.title}</h1>
              {featured.originalTitle ? <p className="hero-original">{featured.originalTitle}</p> : null}
              <div className="title-meta">
                <strong>{featured.match}% phù hợp</strong><span>{featured.year}</span><span className="maturity-badge">{featured.maturity}</span><span>{featured.duration}</span><span>4K</span>
              </div>
              <p className="hero-synopsis">{featured.synopsis}</p>
              <div className="hero-actions">
                {featured.video ? <Link className="button button-cinema" href={`/watch/${featured.id}`}><span aria-hidden="true">▶</span> Xem phim</Link> : null}
                <Link className="button button-glass" href={`/title/${featured.id}`}><span aria-hidden="true">ⓘ</span> Chi tiết</Link>
                <Link className="round-action" href="/my-list" aria-label="Mở danh sách của tôi">＋</Link>
              </div>
              <p className="hero-trust"><i /> Nội dung có nguồn và giấy phép minh bạch</p>
            </div>
            <HeroPosterStage movies={stageMovies} />
          </div>
        </section>
      ) : null}

      <div id="discover" className="page-shell browse-home-content">
        <section className="genre-discovery" aria-labelledby="genre-heading">
          <div className="section-heading editorial-heading"><div><p className="eyebrow">CHỌN THEO CẢM XÚC</p><h2 id="genre-heading">Bạn đang quan tâm gì?</h2></div><Link className="text-link" href="/search">Tìm kiếm nâng cao <span>↗</span></Link></div>
          <div className="genre-bento-grid">
            {genreBento.map((item, index) => (
              <Link key={item.label} className={`genre-bento genre-${item.tone} ${index === 0 || index === 3 ? "genre-wide" : ""}`} href={`/browse?genre=${encodeURIComponent(item.query)}`}>
                <span className="genre-icon">{item.icon}</span><div><strong>{item.label}</strong><small>Khám phá ngay</small></div><i>↗</i>
              </Link>
            ))}
          </div>
        </section>

        <section className="catalog-section" aria-labelledby="catalog-heading">
          <div className="section-heading editorial-heading"><div><p className="eyebrow">TUYỂN CHỌN CHO BẠN</p><h2 id="catalog-heading">{type === "series" ? "Series đáng xem" : selected}</h2></div><span className="section-count">{filtered.length + visibleManaged.length} tựa phim</span></div>
          <div className="filter-row" aria-label="Lọc theo thể loại">
            {genres.map((item) => (
              <Link key={item} className={`filter-chip ${selected === item ? "is-active" : ""}`} href={`/browse?genre=${encodeURIComponent(item)}${type ? `&type=${type}` : ""}`}>{item}</Link>
            ))}
          </div>
          <div className="catalog-grid home-bento-catalog">
            {filtered.map((movie, index) => <MediaCard key={movie.id} movie={movie} priority={index < 5} initialSaved={savedIds.includes(movie.id)} />)}
            {visibleManaged.map((title) => <ManagedTitleCard key={title.id} title={title} />)}
          </div>
        </section>

        {imported.length > 0 ? (
          <section className="external-catalog-section">
            <div className="section-heading editorial-heading"><div><p className="eyebrow">ĐANG ĐƯỢC QUAN TÂM</p><h2>Điện ảnh thế giới</h2></div><p>{imported.length} tựa phim</p></div>
            <ImportedCatalog movies={imported} />
          </section>
        ) : null}
      </div>
      <Footer />
    </main>
  );
}

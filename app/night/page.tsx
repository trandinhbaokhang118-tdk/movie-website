import Link from "next/link";
import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { getViewerContext } from "../viewer-context";
import { listWatchlist } from "@/db/runtime";
import { filterMoviesForMaturity, movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const moods = {
  quiet: { label: "Tĩnh lặng", genres: ["Chính kịch", "Tài liệu", "Hành trình"], copy: "Những câu chuyện có nhịp thở chậm để ngày dài lắng xuống." },
  pulse: { label: "Dồn dập", genres: ["Khoa học viễn tưởng", "Tội phạm", "Bí ẩn"], copy: "Ánh sáng, bí mật và nhịp tim còn thức." },
  warm: { label: "Ấm áp", genres: ["Gia đình", "Tuổi trẻ", "Lãng mạn"], copy: "Một góc dịu dàng trước khi màn đêm khép lại." },
  strange: { label: "Kỳ lạ", genres: ["Bí ẩn", "Kỳ ảo", "Khoa học viễn tưởng"], copy: "Cho những đêm bạn muốn bước ra khỏi thực tại." },
} as const;

export default async function NightPage({ searchParams }: { searchParams: Promise<{ mood?: string; minutes?: string }> }) {
  const { mood = "quiet", minutes = "120" } = await searchParams;
  const selected = Object.hasOwn(moods, mood) ? mood as keyof typeof moods : "quiet";
  const time = ["45", "90", "120", "all"].includes(minutes) ? minutes : "120";
  const context = await getViewerContext();
  const savedIds = context ? await listWatchlist(context.viewer.id, context.profile.id) : [];
  const visible = filterMoviesForMaturity(movies, context?.profile.maturity ?? "T18");
  const ranked = visible.map((movie) => ({ movie, score: movie.genres.filter((genre) => moods[selected].genres.includes(genre as never)).length }))
    .filter(({ movie, score }) => score > 0 && (time === "all" || (movie.durationSeconds ?? 7200) <= Number(time) * 60))
    .sort((a, b) => b.score - a.score || b.movie.match - a.movie.match).map(({ movie }) => movie);
  const results = ranked.length ? ranked : visible.slice(0, 8);

  return <main><SiteHeader /><section className="night-page page-shell">
    <div className="night-orbit" aria-hidden="true" /><p className="eyebrow">NIGHT COMPASS · TÍNH NĂNG CINEWAVE</p>
    <h1>Đêm nay bạn muốn cảm thấy thế nào?</h1><p className="night-copy">{moods[selected].copy}</p>
    <nav className="mood-selector" aria-label="Chọn tâm trạng">{Object.entries(moods).map(([key, value]) => <Link className={selected === key ? "is-active" : ""} href={`/night?mood=${key}&minutes=${time}`} key={key}>{value.label}</Link>)}</nav>
    <div className="time-selector"><span>Tôi có</span>{[{ key: "45", label: "45 phút" }, { key: "90", label: "90 phút" }, { key: "120", label: "2 giờ" }, { key: "all", label: "Cả đêm" }].map((item) => <Link className={time === item.key ? "is-active" : ""} href={`/night?mood=${selected}&minutes=${item.key}`} key={item.key}>{item.label}</Link>)}</div>
    <div className="catalog-heading"><h2>La bàn đã tìm thấy</h2><p>{results.length} câu chuyện</p></div><div className="catalog-grid">{results.map((movie, index) => <MediaCard key={movie.id} movie={movie} priority={index < 5} initialSaved={savedIds.includes(movie.id)} />)}</div>
  </section><Footer /></main>;
}

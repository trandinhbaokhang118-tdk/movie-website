import Link from "next/link";
import type { ManagedTitle } from "@/db/runtime";

export function ManagedTitleCard({ title }: { title: ManagedTitle }) {
  const poster = title.posterUrl?.replace(/["'()\\]/g, (character) => encodeURIComponent(character));
  const detailHref = `/title/${title.id}`;
  const isUpcoming = title.status === "scheduled";
  const releaseLabel = isUpcoming && title.scheduledAt
    ? `Ra mắt ${new Date(title.scheduledAt).toLocaleString("vi-VN")}`
    : "Nội dung CineWave";

  return <article className="media-card managed-card">
    <div className="media-card-stage">
      <Link className="media-card-link" href={detailHref}><div className="poster-wrap managed-poster" style={poster ? { backgroundImage: `linear-gradient(180deg, transparent 45%, rgba(5,4,11,.92)), url("${poster}")` } : undefined}><span className="managed-poster-mark">CW</span><span className="media-badge">{isUpcoming ? "SẮP RA MẮT" : "MỚI PHÁT HÀNH"}</span></div></Link>
      <div className="media-card-preview"><div className="media-preview-heading"><div><strong>{title.title}</strong><small>{releaseLabel}</small></div><span>{isUpcoming ? "SOON" : "LIVE"}</span></div><div className="media-preview-actions">{!isUpcoming && title.videoUrl ? <Link className="media-preview-play" href={`/watch/${title.id}`}><span aria-hidden="true">▶</span> Xem phim</Link> : null}<Link className="media-preview-detail" href={detailHref}><span aria-hidden="true">ⓘ</span> Chi tiết</Link></div><div className="media-preview-meta"><span>{title.releaseYear}</span><span>{title.maturity}</span><span>{title.duration}</span></div><div className="media-preview-genres">{title.genres.split(",").slice(0, 3).map((genre) => <span key={genre}>{genre.trim()}</span>)}</div></div>
    </div>
    <Link className="media-card-copy" href={detailHref}><h3>{title.title}</h3><p>{isUpcoming && title.scheduledAt ? `Mở khóa ${new Date(title.scheduledAt).toLocaleDateString("vi-VN")}` : `${title.releaseYear} · ${title.maturity} · ${title.duration}`}</p></Link>
  </article>;
}

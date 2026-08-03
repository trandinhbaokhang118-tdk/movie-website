import { notFound } from "next/navigation";
import { Player } from "../../components/Player";
import { requireUser } from "../../auth";
import Link from "next/link";
import { authorizePlayback, ensureViewer, findManagedTitle, getActiveProfile, getWatchProgress, maturityRatingAllows } from "@/db/runtime";
import { findMovie, movieVideo } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  const managed = movie ? null : await findManagedTitle(id);
  if (!movie && !managed) notFound();
  if (managed?.status === "scheduled") {
    return <main className="watch-error"><div>
      <p className="eyebrow">SẮP RA MẮT</p><h1>Phim chưa đến giờ phát hành</h1>
      <p>{managed.scheduledAt ? `Nội dung sẽ tự động mở khóa vào ${new Date(managed.scheduledAt).toLocaleString("vi-VN")}.` : "Ngày phát hành đang được cập nhật."} Hiện tại bạn chỉ có thể xem ảnh và thông tin phim.</p>
      <div className="hero-actions"><Link className="button button-primary" href={`/title/${id}`}>Xem thông tin phim</Link><Link className="button button-secondary" href="/">Về trang chủ</Link></div>
    </div></main>;
  }
  const managedVideoUrl = managed?.videoUrl ?? "";
  const managedVideoType = /\.m3u8(?:$|\?)/i.test(managedVideoUrl) ? "application/vnd.apple.mpegurl" : /\.webm(?:$|\?)/i.test(managedVideoUrl) ? "video/webm" : "video/mp4";
  const video = movie ? movieVideo(movie) : { src: managedVideoUrl, fallbackSrc: null, type: managedVideoType, attribution: `${managed!.title} · ${managed!.licenseName}` };
  const user = await requireUser(`/watch/${id}`);
  const viewer = await ensureViewer(user.email, user.displayName);
  const activeProfile = await getActiveProfile(viewer.id);
  const maturityAllowed = movie
    ? maturityRatingAllows(movie.maturity, activeProfile.maturity)
    : maturityRatingAllows(managed!.maturity, activeProfile.maturity);
  if (!maturityAllowed) {
    return <main className="watch-error"><div>
      <p className="eyebrow">GIỚI HẠN HỒ SƠ</p><h1>Hồ sơ hiện tại chưa thể xem phim này</h1>
      <p>Phim được phân loại {movie?.maturity ?? managed!.maturity}, cao hơn giới hạn {activeProfile.maturity} của hồ sơ “{activeProfile.name}”. Hãy chuyển sang hồ sơ phù hợp để xem.</p>
      <div className="hero-actions"><Link className="button button-primary" href="/profiles">Chuyển hồ sơ</Link><Link className="button button-secondary" href={`/title/${id}`}>Xem chi tiết</Link><Link className="button button-secondary" href="/browse">Trở lại thư viện</Link></div>
    </div></main>;
  }
  const grant = await authorizePlayback(viewer.id, id).catch((error) => {
    console.error("Playback authorization failed", { movieId: id, userId: viewer.id, code: error instanceof Error ? error.message : "UNKNOWN" });
    throw error;
  });
  const progress = await getWatchProgress(viewer.id, grant.profile.id, id);
  return (
    <main className="watch-page">
      <Player
        movieId={id}
        sessionId={grant.sessionId}
        title={movie?.title ?? managed!.title}
        source={video.src}
        fallbackSource={video.fallbackSrc}
        sourceType={video.type}
        attribution={video.attribution}
        qualityLabel={movie?.source || managed ? "CC · HD" : "HD · DEMO"}
        resumeAt={progress?.positionSeconds ?? 0}
        subtitles={managed?.subtitleUrl ? [{ src: managed.subtitleUrl, language: "vi", label: "Tiếng Việt" }] : []}
      />
    </main>
  );
}

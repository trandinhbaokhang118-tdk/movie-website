import { notFound } from "next/navigation";
import { Player } from "../../components/Player";
import { requireUser } from "../../auth";
import { authorizePlayback, ensureViewer, findManagedTitle, getWatchProgress } from "@/db/runtime";
import { findMovie, movieVideo } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  const managed = movie ? null : await findManagedTitle(id);
  if (!movie && !managed) notFound();
  const video = movie ? movieVideo(movie) : { src: managed!.videoUrl ?? "", fallbackSrc: null, type: "video/mp4", attribution: `${managed!.title} · ${managed!.licenseName}` };
  const user = await requireUser(`/watch/${id}`);
  const viewer = await ensureViewer(user.email, user.displayName);
  const grant = await authorizePlayback(viewer.id, id);
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
      />
    </main>
  );
}

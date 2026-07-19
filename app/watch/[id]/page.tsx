import { notFound } from "next/navigation";
import { Player } from "../../components/Player";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { authorizePlayback, ensureViewer, getWatchProgress } from "@/db/runtime";
import { findMovie, movieVideo } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) notFound();
  const video = movieVideo(movie);
  const user = await requireChatGPTUser(`/watch/${id}`);
  const viewer = await ensureViewer(user.email, user.displayName);
  const grant = await authorizePlayback(viewer.id, movie.id);
  const progress = await getWatchProgress(viewer.id, grant.profile.id, movie.id);
  return (
    <main className="watch-page">
      <Player
        movieId={movie.id}
        sessionId={grant.sessionId}
        title={movie.title}
        source={video.src}
        sourceType={video.type}
        attribution={video.attribution}
        qualityLabel={movie.source ? "CC · HD" : "HD · DEMO"}
        resumeAt={progress?.positionSeconds ?? 0}
      />
    </main>
  );
}

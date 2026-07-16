import { notFound } from "next/navigation";
import { Player } from "../../components/Player";
import { getChatGPTUser } from "../../chatgpt-auth";
import { ensureViewer, getWatchProgress } from "@/db/runtime";
import { demoVideo, findMovie } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) notFound();
  const user = await getChatGPTUser();
  const progress = user
    ? await ensureViewer(user.email, user.displayName).then((viewer) => getWatchProgress(viewer.id, movie.id))
    : null;
  return (
    <main className="watch-page">
      <Player
        movieId={movie.id}
        title={movie.title}
        source={demoVideo.mp4}
        attribution={demoVideo.attribution}
        resumeAt={progress?.positionSeconds ?? 0}
      />
    </main>
  );
}

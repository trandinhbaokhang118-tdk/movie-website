import { notFound } from "next/navigation";
import { Player } from "../../components/Player";
import { demoVideo, findMovie } from "@/lib/catalog";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = findMovie(id);
  if (!movie) notFound();
  return (
    <main className="watch-page">
      <Player
        movieId={movie.id}
        title={movie.title}
        source={demoVideo.mp4}
        attribution={demoVideo.attribution}
      />
    </main>
  );
}

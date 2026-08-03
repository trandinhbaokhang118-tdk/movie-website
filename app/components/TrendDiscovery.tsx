"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Movie } from "@/lib/catalog";
import type { TrendPeriod, TrendSnapshot } from "@/db/runtime";
import { PosterArtwork } from "./PosterArtwork";
import { QuickSaveButton } from "./QuickSaveButton";

const periodLabels: Record<TrendPeriod, string> = { hour: "Giờ", day: "Ngày", week: "Tuần" };

export function TrendDiscovery({
  snapshots,
  movieMap,
  savedMovieIds = [],
}: {
  snapshots: Record<TrendPeriod, TrendSnapshot>;
  movieMap: Record<string, Movie>;
  savedMovieIds?: string[];
}) {
  const [period, setPeriod] = useState<TrendPeriod>("day");
  const [liveSnapshots, setLiveSnapshots] = useState(snapshots);
  const [liveState, setLiveState] = useState<"connecting" | "live" | "offline">("live");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const snapshot = liveSnapshots[period];
  const saved = new Set(savedMovieIds);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/trends?${new URLSearchParams({ period })}`, { cache: "no-store" });
      if (!response.ok) throw new Error("trend sync failed");
      const payload = await response.json() as { snapshot: TrendSnapshot; generatedAt: string };
      setLiveSnapshots((current) => ({ ...current, [period]: payload.snapshot }));
      setUpdatedAt(new Date(payload.generatedAt));
      setLiveState("live");
    } catch {
      setLiveState("offline");
    }
  }, [period]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10_000);
    const onSignal = () => void refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("cinewave:trend-signal", onSignal);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("cinewave:trend-signal", onSignal);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return (
    <section className="trend-discovery" aria-labelledby="trend-discovery-title">
      <div className="trend-shell-heading">
        <div>
          <p className="eyebrow">TÍN HIỆU TÌM KIẾM · TIM · LƯU · XEM</p>
          <h2 id="trend-discovery-title"><span aria-hidden="true">↗</span> Phim đang trending</h2>
        </div>
        <div className="trend-live-tools">
          <span className={`trend-live-status is-${liveState}`} role="status" aria-live="polite"><i /> {liveState === "offline" ? "Mất kết nối" : liveState === "connecting" ? "Đang kết nối" : "LIVE · 10 giây"}{updatedAt ? <small>Cập nhật {updatedAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</small> : null}</span>
          <div className="trend-tabs" role="tablist" aria-label="Khoảng thời gian thịnh hành">
            {(Object.keys(periodLabels) as TrendPeriod[]).map((item) => (
              <button key={item} role="tab" type="button" aria-selected={period === item} className={period === item ? "is-active" : ""} onClick={() => { setLiveState("live"); setPeriod(item); }}>{periodLabels[item]}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="hot-tag-panel">
        <div><strong>Hot tags</strong><span>Được nhắc nhiều trong {periodLabels[period].toLocaleLowerCase("vi")}</span></div>
        <div className="hot-tag-list">
          {snapshot.hotTags.map((tag, index) => (
            <Link key={tag.label} href={`/search?${new URLSearchParams({ q: tag.label })}`} className={index < 3 ? "is-hot" : ""}>#{tag.label}<small>{tag.signals}</small></Link>
          ))}
        </div>
      </div>

      <div className="trend-ranking-list" role="tabpanel">
        {snapshot.ranking.map((entry, index) => {
          const movie = movieMap[entry.movieId];
          if (!movie) return null;
          const deltaClass = entry.trendPercent > 0 ? "is-up" : entry.trendPercent < 0 ? "is-down" : "is-flat";
          return (
            <article className="trend-ranking-card" key={movie.id}>
              <div className={`trend-rank ${index < 3 ? `rank-${index + 1}` : ""}`}><strong>{index + 1}</strong><span className={deltaClass}>{entry.trendPercent > 0 ? "▲" : entry.trendPercent < 0 ? "▼" : "—"} {Math.abs(entry.trendPercent) || ""}</span></div>
              <Link className="trend-poster" href={`/title/${movie.id}`}><PosterArtwork src={movie.poster} title={movie.title} alt="" sizes="76px" /></Link>
              <div className="trend-movie-copy">
                <Link href={`/title/${movie.id}`}><h3>{movie.title}</h3></Link>
                {movie.originalTitle ? <p>{movie.originalTitle}</p> : null}
                <div><span className="quality-pill">HD</span><span>{movie.series ? `${movie.series.episodes} tập` : movie.duration}</span><span>{movie.year}</span></div>
              </div>
              <div className="trend-score"><strong>★ {movie.match / 10}</strong><span>◎ {entry.views.toLocaleString("vi-VN")} lượt xem</span><small>{entry.forecast}</small></div>
              <QuickSaveButton movieId={movie.id} initialSaved={saved.has(movie.id)} />
            </article>
          );
        })}
      </div>
      <p className="trend-method"><span>✦</span> Ranking tự đồng bộ mỗi 10 giây và cập nhật ngay sau tương tác lưu phim. Dự báo dùng tốc độ tăng tìm kiếm, lượt xem, lượt tim và Tủ phim. {snapshot.totalSignals === 0 ? "Hệ thống đang dùng tín hiệu biên tập trong lúc thu thập dữ liệu đầu tiên." : `${snapshot.totalSignals.toLocaleString("vi-VN")} tín hiệu đã được phân tích.`}</p>
    </section>
  );
}

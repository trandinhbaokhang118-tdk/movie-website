"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Movie } from "@/lib/catalog";
import { movieVideo } from "@/lib/catalog";
import { TrailerModal } from "./TrailerModal";

export function CinematicHero({ movie }: { movie: Movie }) {
  const [motionEnabled, setMotionEnabled] = useState(false);
  const video = movieVideo(movie);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setMotionEnabled(!reduced.matches && window.innerWidth > 760);
    update();
    reduced.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      reduced.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <section className="hero cinematic-hero" style={{ "--hero-accent": movie.accent } as React.CSSProperties}>
      <div className="hero-media" aria-hidden="true">
        <Image className="hero-image" src={movie.backdrop} alt="" fill priority sizes="100vw" />
        {motionEnabled ? (
          <video className="hero-preview" src={video.src} muted loop autoPlay playsInline preload="metadata" />
        ) : null}
      </div>
      <div className="hero-scrim" />
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-content page-shell">
        <p className="hero-kicker"><span>CINEWAVE</span> PHIM NỔI BẬT</p>
        <h1>{movie.title}</h1>
        <p className="hero-original">{movie.originalTitle}</p>
        <div className="title-meta">
          <strong>{movie.match}% phù hợp</strong>
          <span>{movie.year}</span>
          <span className="maturity-badge">{movie.maturity}</span>
          <span>{movie.duration}</span>
          <span>4K</span>
        </div>
        <p className="hero-synopsis">{movie.synopsis}</p>
        <div className="hero-actions">
          {movie.source && movie.video ? <Link className="button button-primary" href={`/watch/${movie.id}`}><span aria-hidden="true">▶</span> Xem ngay</Link> : <span className="button button-secondary" aria-disabled="true">Chưa có quyền phát</span>}
          <TrailerModal title={movie.title} videoSrc={video.src} />
          <Link className="button button-secondary" href={`/title/${movie.id}`}><span aria-hidden="true">ⓘ</span> Chi tiết</Link>
        </div>
        <p className="hero-trailer-note">{movie.source ? `${movie.source.licenseName} · phát sau khi bạn chủ động chọn` : "Trailer demo nguồn mở · phát sau khi bạn chủ động chọn"}</p>
      </div>
      <div className="hero-soundwave" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div>
      <p className="hero-credit">Ảnh điện ảnh từ Unsplash · {movie.source?.attribution ?? "Video Blender Foundation"}</p>
    </section>
  );
}

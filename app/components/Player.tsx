"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function Player({
  movieId,
  title,
  source,
  attribution,
}: {
  movieId: string;
  title: string;
  source: string;
  attribution: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [message, setMessage] = useState("Sẵn sàng phát");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const save = () => {
      if (!Number.isFinite(video.currentTime) || video.currentTime < 1) return;
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, positionSeconds: Math.floor(video.currentTime) }),
      });
    };
    const interval = window.setInterval(save, 15000);
    video.addEventListener("pause", save);
    return () => {
      window.clearInterval(interval);
      video.removeEventListener("pause", save);
    };
  }, [movieId]);

  return (
    <div className="player-shell">
      <div className="player-topbar">
        <Link href={`/title/${movieId}`} className="player-back" aria-label={`Quay lại ${title}`}>←</Link>
        <div><p>ĐANG XEM</p><h1>{title}</h1></div>
        <span className="player-quality">HD · DEMO</span>
      </div>
      <video
        ref={videoRef}
        className="video-player"
        controls
        playsInline
        preload="metadata"
        onPlay={() => { setStarted(true); setMessage("Đang phát"); }}
        onWaiting={() => setMessage("Đang tải video…")}
        onPlaying={() => setMessage("Đang phát")}
        onEnded={() => setMessage("Đã xem xong")}
      >
        <source src={source} type="video/mp4" />
        Trình duyệt của bạn chưa hỗ trợ phát video HTML5.
      </video>
      {!started && (
        <div className="player-prompt" aria-hidden="true">
          <span>▶</span><p>Nhấn nút phát để bắt đầu</p>
        </div>
      )}
      <div className="player-status" aria-live="polite">
        <span>{message}</span>
        <span>{attribution}</span>
      </div>
    </div>
  );
}

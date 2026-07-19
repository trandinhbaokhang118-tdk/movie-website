"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function Player({
  movieId,
  sessionId,
  title,
  source,
  sourceType = "video/mp4",
  attribution,
  qualityLabel = "HD",
  resumeAt = 0,
}: {
  movieId: string;
  sessionId: string;
  title: string;
  source: string;
  sourceType?: string;
  attribution: string;
  qualityLabel?: string;
  resumeAt?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [message, setMessage] = useState(resumeAt > 5 ? "Đã tìm thấy vị trí xem trước" : "Sẵn sàng phát");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const save = (final = false) => {
      if (!Number.isFinite(video.currentTime) || video.currentTime < 1) return;
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, sessionId, positionSeconds: Math.floor(video.currentTime), final }),
        keepalive: true,
      });
    };
    const resume = () => {
      if (resumeAt <= 5 || !Number.isFinite(video.duration) || resumeAt >= video.duration - 20) return;
      video.currentTime = resumeAt;
      setMessage(`Tiếp tục từ ${formatTime(resumeAt)}`);
    };
    const saveWhenHidden = () => {
      if (document.visibilityState === "hidden") save();
    };
    const interval = window.setInterval(save, 15000);
    const savePause = () => save(false);
    const saveEnded = () => save(true);
    const closeOnPageExit = () => save(true);
    video.addEventListener("pause", savePause);
    video.addEventListener("ended", saveEnded);
    video.addEventListener("loadedmetadata", resume, { once: true });
    document.addEventListener("visibilitychange", saveWhenHidden);
    window.addEventListener("pagehide", closeOnPageExit);
    return () => {
      window.clearInterval(interval);
      video.removeEventListener("pause", savePause);
      video.removeEventListener("ended", saveEnded);
      video.removeEventListener("loadedmetadata", resume);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      window.removeEventListener("pagehide", closeOnPageExit);
    };
  }, [movieId, resumeAt, sessionId]);

  const changeSpeed = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : 1;
    video.playbackRate = next;
    setSpeed(next);
  };

  const enterPictureInPicture = async () => {
    const video = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    if (video?.requestPictureInPicture) await video.requestPictureInPicture().catch(() => undefined);
  };

  return (
    <div className="player-shell">
      <div className="player-topbar">
        <Link href={`/title/${movieId}`} className="player-back" aria-label={`Quay lại ${title}`}>←</Link>
        <div><p>ĐANG XEM</p><h1>{title}</h1></div>
        <span className="player-quality">{qualityLabel}</span>
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
        <source src={source} type={sourceType} />
        Trình duyệt của bạn chưa hỗ trợ phát video HTML5.
      </video>
      {!started && (
        <div className="player-prompt" aria-hidden="true">
          <span>▶</span><p>{resumeAt > 5 ? `Tiếp tục từ ${formatTime(resumeAt)}` : "Nhấn nút phát để bắt đầu"}</p>
        </div>
      )}
      <div className="player-status" aria-live="polite">
        <span>{message}</span>
        <span className="player-tools">
          <button type="button" onClick={changeSpeed} aria-label="Đổi tốc độ phát">{speed}×</button>
          <button type="button" onClick={enterPictureInPicture}>Hình trong hình</button>
          <span>{attribution}</span>
        </span>
      </div>
    </div>
  );
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

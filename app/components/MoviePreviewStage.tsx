"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const PREVIEW_SECONDS = 8;

export function MoviePreviewStage({
  title,
  poster,
  backdrop,
  scenes,
  videoSrc,
  previewStartSeconds = 168,
}: {
  title: string;
  poster: string;
  backdrop: string;
  scenes: string[];
  videoSrc?: string;
  previewStartSeconds?: number;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewRequest = useRef(0);
  const [previewing, setPreviewing] = useState(false);

  const waitForMetadata = useCallback((player: HTMLVideoElement) => {
    if (player.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve(true);

    return new Promise<boolean>((resolve) => {
      const finish = (ready: boolean) => {
        player.removeEventListener("loadedmetadata", onReady);
        player.removeEventListener("error", onError);
        resolve(ready);
      };
      const onReady = () => finish(true);
      const onError = () => finish(false);
      player.addEventListener("loadedmetadata", onReady, { once: true });
      player.addEventListener("error", onError, { once: true });
      player.load();
    });
  }, []);

  const stopPreview = useCallback(() => {
    previewRequest.current += 1;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = null;
    const player = video.current;
    if (player) {
      player.pause();
    }
    setPreviewing(false);
  }, []);

  const startPreview = useCallback(async () => {
    const player = video.current;
    if (!player || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const request = previewRequest.current + 1;
    previewRequest.current = request;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    const metadataReady = await waitForMetadata(player);
    if (!metadataReady || request !== previewRequest.current) return;

    const latestSafeStart = Number.isFinite(player.duration)
      ? Math.max(0, player.duration - PREVIEW_SECONDS - 0.25)
      : previewStartSeconds;
    player.currentTime = Math.min(previewStartSeconds, latestSafeStart);
    player.muted = true;
    try {
      await player.play();
      if (request !== previewRequest.current) {
        player.pause();
        return;
      }
      setPreviewing(true);
      stopTimer.current = setTimeout(stopPreview, PREVIEW_SECONDS * 1_000);
    } catch {
      setPreviewing(false);
    }
  }, [previewStartSeconds, stopPreview, waitForMetadata]);

  useEffect(() => () => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
  }, []);

  return (
    <div
      className={`movie-preview-stage${previewing ? " is-previewing" : ""}`}
      onPointerEnter={() => void startPreview()}
      onPointerLeave={stopPreview}
      onFocus={() => void startPreview()}
      onBlur={stopPreview}
      tabIndex={videoSrc ? 0 : -1}
      aria-label={videoSrc ? `Rê chuột hoặc focus để xem trước ${PREVIEW_SECONDS} giây phim ${title}` : `Hình ảnh phim ${title}`}
    >
      <div className="movie-preview-glow" aria-hidden="true" />
      <div className="movie-preview-panel movie-preview-panel-back">
        <Image src={scenes[0] ?? backdrop} alt="" fill sizes="360px" />
      </div>
      <div className="movie-preview-panel movie-preview-panel-side">
        <Image src={scenes[1] ?? poster} alt="" fill sizes="220px" />
      </div>
      <div className="movie-preview-panel movie-preview-panel-main">
        <Image src={backdrop} alt={`Cảnh hoạt hình 3D trong ${title}`} fill priority sizes="(max-width: 760px) 88vw, 520px" />
        {videoSrc ? <video ref={video} src={videoSrc} muted playsInline preload="metadata" poster={backdrop} aria-label={`Trailer ngắn ${title}`} /> : null}
        <div className="movie-preview-overlay" />
        <span className="movie-preview-badge">3D ANIMATION</span>
        <div className="movie-preview-caption">
          <span className="movie-preview-pulse" aria-hidden="true" />
          <div><strong>{previewing ? "Đang phát preview" : "Rê để xem chuyển động"}</strong><small>{previewing ? `${PREVIEW_SECONDS} giây · không âm thanh` : "Trailer ngắn 5–10 giây"}</small></div>
        </div>
        {previewing ? <span className="movie-preview-progress" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}

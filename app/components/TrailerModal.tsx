"use client";

import { useEffect, useId, useRef, useState } from "react";

type TrailerModalProps = {
  title: string;
  youtubeKey?: string | null;
  videoSrc?: string;
  triggerLabel?: string;
  compact?: boolean;
  videoStartSeconds?: number;
  maxPreviewSeconds?: number;
};

export function TrailerModal({
  title,
  youtubeKey,
  videoSrc,
  triggerLabel = "Xem trailer",
  compact = false,
  videoStartSeconds = 0,
  maxPreviewSeconds,
}: TrailerModalProps) {
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const closeButton = useRef<HTMLButtonElement>(null);
  const videoPlayer = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const playable = Boolean(youtubeKey || videoSrc);
  return (
    <>
      <button
        className={compact ? "trailer-trigger trailer-trigger-compact" : "button button-trailer"}
        type="button"
        onClick={() => setOpen(true)}
        disabled={!playable}
      >
        <span className="trailer-play" aria-hidden="true">▶</span>
        {playable ? triggerLabel : "Chưa có trailer"}
      </button>
      {open && playable ? (
        <div className="trailer-backdrop" onMouseDown={() => setOpen(false)}>
          <section
            className="trailer-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="trailer-dialog-bar">
              <div>
                <p>TRAILER</p>
                <h2 id={headingId}>{title}</h2>
              </div>
              <button ref={closeButton} className="trailer-close" type="button" onClick={() => setOpen(false)} aria-label="Đóng trailer">×</button>
            </div>
            <div className="trailer-frame">
              {youtubeKey ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1&playsinline=1&rel=0`}
                  title={`Trailer ${title}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoPlayer}
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  aria-label={`Trailer demo ${title}`}
                  onLoadedMetadata={(event) => { event.currentTarget.currentTime = videoStartSeconds; }}
                  onTimeUpdate={(event) => {
                    if (maxPreviewSeconds && event.currentTarget.currentTime >= videoStartSeconds + maxPreviewSeconds) {
                      event.currentTarget.pause();
                      event.currentTarget.currentTime = videoStartSeconds;
                    }
                  }}
                />
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type ViewMode = "fit" | "fill" | "zoom";
type PictureMode = "standard" | "cinema" | "comfort";
type IconName =
  | "arrow-left" | "audio" | "captions" | "check" | "compress" | "expand"
  | "forward" | "pause" | "pip" | "play" | "rewind" | "settings" | "volume" | "volume-off";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function Player({
  movieId,
  sessionId,
  title,
  source,
  fallbackSource,
  sourceType = "video/mp4",
  attribution,
  qualityLabel = "HD",
  resumeAt = 0,
}: {
  movieId: string;
  sessionId: string;
  title: string;
  source: string;
  fallbackSource?: string | null;
  sourceType?: string;
  attribution: string;
  qualityLabel?: string;
  resumeAt?: number;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("auto");
  const [viewMode, setViewMode] = useState<ViewMode>("fit");
  const [pictureMode, setPictureMode] = useState<PictureMode>("standard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [message, setMessage] = useState(resumeAt > 5 ? "Đã tìm thấy vị trí xem trước" : "Sẵn sàng phát");

  const scheduleControls = useCallback((force = false) => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (!force && videoRef.current && !videoRef.current.paused) {
      hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3200);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play().catch(() => setMessage("Không thể phát video. Hãy thử lại."));
    else video.pause();
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), video.duration);
    setCurrentTime(video.currentTime);
    setMessage(seconds > 0 ? "Tua tới 10 giây" : "Lùi lại 10 giây");
    scheduleControls();
  }, [scheduleControls]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) await shellRef.current?.requestFullscreen().catch(() => undefined);
    else await document.exitFullscreen().catch(() => undefined);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const save = (final = false) => {
      if (!Number.isFinite(video.currentTime)) return;
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, sessionId, positionSeconds: Math.floor(video.currentTime), final }),
        keepalive: true,
      });
    };
    const resume = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      if (resumeAt <= 5 || !Number.isFinite(video.duration) || resumeAt >= video.duration - 20) return;
      video.currentTime = resumeAt;
      setCurrentTime(resumeAt);
      setMessage(`Tiếp tục từ ${formatTime(resumeAt)}`);
    };
    const saveWhenHidden = () => { if (document.visibilityState === "hidden") save(); };
    const savePause = () => save(false);
    const saveEnded = () => save(true);
    const closeOnPageExit = () => save(true);
    const syncFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    const interval = window.setInterval(save, 15000);
    video.addEventListener("pause", savePause);
    video.addEventListener("ended", saveEnded);
    video.addEventListener("loadedmetadata", resume, { once: true });
    document.addEventListener("visibilitychange", saveWhenHidden);
    document.addEventListener("fullscreenchange", syncFullscreen);
    window.addEventListener("pagehide", closeOnPageExit);
    return () => {
      save(true);
      window.clearInterval(interval);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      video.removeEventListener("pause", savePause);
      video.removeEventListener("ended", saveEnded);
      video.removeEventListener("loadedmetadata", resume);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      document.removeEventListener("fullscreenchange", syncFullscreen);
      window.removeEventListener("pagehide", closeOnPageExit);
    };
  }, [movieId, resumeAt, sessionId]);

  const enterPictureInPicture = async () => {
    const video = videoRef.current as (HTMLVideoElement & { requestPictureInPicture?: () => Promise<unknown> }) | null;
    if (video?.requestPictureInPicture) {
      await video.requestPictureInPicture().catch(() => setMessage("Trình duyệt chưa hỗ trợ hình trong hình"));
    }
  };

  const changeSpeed = (next: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = next;
    setSpeed(next);
    setMessage(`Tốc độ phát ${next}×`);
  };

  const changeVolume = (next: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = next;
    video.muted = next === 0;
    setVolume(next);
    setMuted(next === 0);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).matches("button, input, a")) return;
    if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); void togglePlay(); }
    else if (event.key === "ArrowLeft" || event.key.toLowerCase() === "j") { event.preventDefault(); seekBy(-10); }
    else if (event.key === "ArrowRight" || event.key.toLowerCase() === "l") { event.preventDefault(); seekBy(10); }
    else if (event.key.toLowerCase() === "m") toggleMute();
    else if (event.key.toLowerCase() === "f") void toggleFullscreen();
    scheduleControls();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const videoClass = `video-player view-${viewMode} picture-${pictureMode}`;

  return (
    <div
      ref={shellRef}
      className={`player-shell ${controlsVisible || settingsOpen || !started ? "controls-visible" : "controls-hidden"}`}
      onMouseMove={() => scheduleControls(settingsOpen)}
      onMouseLeave={() => playing && !settingsOpen && setControlsVisible(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className={videoClass}
        playsInline
        preload="metadata"
        onClick={() => void togglePlay()}
        onDoubleClick={() => void toggleFullscreen()}
        onPlay={() => { setStarted(true); setPlaying(true); setBuffering(false); setMessage("Đang phát"); scheduleControls(); }}
        onPause={() => { setPlaying(false); setMessage("Đã tạm dừng"); scheduleControls(true); }}
        onWaiting={() => { setBuffering(true); setMessage("Đang tải video…"); }}
        onPlaying={() => { setBuffering(false); setMessage("Đang phát"); }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
        onEnded={() => { setPlaying(false); setMessage("Đã xem xong"); setControlsVisible(true); }}
      >
        <source src={source} type={sourceType} />
        {fallbackSource && fallbackSource !== source ? <source src={fallbackSource} type={sourceType} /> : null}
        Trình duyệt của bạn chưa hỗ trợ phát video HTML5.
      </video>

      <div className="player-vignette" aria-hidden="true" />
      <header className="player-topbar">
        <Link href={`/title/${movieId}`} className="player-icon-button player-back" aria-label={`Quay lại trang ${title}`}>
          <Icon name="arrow-left" />
        </Link>
        <div className="player-title-block">
          <p>ĐANG XEM</p>
          <h1>{title}</h1>
        </div>
        <span className="player-quality-badge"><i />{quality === "auto" ? "TỰ ĐỘNG" : qualityLabel}</span>
      </header>

      {!started && (
        <button className="player-start" type="button" onClick={() => void togglePlay()} aria-label={resumeAt > 5 ? "Tiếp tục xem phim" : "Phát phim"}>
          <span><Icon name="play" /></span>
          <strong>{resumeAt > 5 ? `Tiếp tục từ ${formatTime(resumeAt)}` : "Bắt đầu xem"}</strong>
          <small>Nhấn Space để phát</small>
        </button>
      )}

      {buffering && <div className="player-loader" role="status" aria-label="Đang tải video"><span /></div>}

      <div className="player-bottom">
        <div className="player-timeline">
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (videoRef.current) videoRef.current.currentTime = next;
              setCurrentTime(next);
            }}
            aria-label="Tiến trình phim"
            style={{ "--player-progress": `${progress}%` } as React.CSSProperties}
          />
          <div className="player-time"><span>{formatTime(currentTime)}</span><span>{duration ? `-${formatTime(Math.max(duration - currentTime, 0))}` : "--:--"}</span></div>
        </div>

        <div className="player-commandbar">
          <div className="player-command-group">
            <ControlButton label="Lùi 10 giây" icon="rewind" onClick={() => seekBy(-10)} />
            <ControlButton label={playing ? "Tạm dừng" : "Phát"} icon={playing ? "pause" : "play"} primary onClick={() => void togglePlay()} />
            <ControlButton label="Tua tới 10 giây" icon="forward" onClick={() => seekBy(10)} />
            <div className="player-volume">
              <ControlButton label={muted ? "Bật âm thanh" : "Tắt âm thanh"} icon={muted || volume === 0 ? "volume-off" : "volume"} onClick={toggleMute} />
              <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Âm lượng" />
            </div>
            <span className="player-time-compact">{formatTime(currentTime)} <i>/</i> {formatTime(duration)}</span>
          </div>

          <div className="player-command-group player-command-group-right">
            <button type="button" className="player-text-button" onClick={() => { setSettingsOpen(true); scheduleControls(true); }} aria-label="Cài đặt phụ đề">
              <Icon name="captions" /><span>Phụ đề</span>
            </button>
            <button type="button" className="player-text-button" onClick={() => { setSettingsOpen(true); scheduleControls(true); }} aria-label="Cài đặt âm thanh">
              <Icon name="audio" /><span>Âm thanh</span>
            </button>
            <ControlButton label="Hình trong hình" icon="pip" onClick={() => void enterPictureInPicture()} />
            <ControlButton label="Cài đặt trình phát" icon="settings" active={settingsOpen} onClick={() => { setSettingsOpen((value) => !value); scheduleControls(true); }} />
            <ControlButton label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"} icon={fullscreen ? "compress" : "expand"} onClick={() => void toggleFullscreen()} />
          </div>
        </div>
        <div className="player-status" aria-live="polite"><span>{message}</span><span>{attribution}</span></div>
      </div>

      {settingsOpen && (
        <aside className="player-settings" aria-label="Cài đặt trải nghiệm xem">
          <div className="player-settings-header">
            <div><p>TRẢI NGHIỆM XEM</p><h2>Cài đặt trình phát</h2></div>
            <button type="button" onClick={() => { setSettingsOpen(false); scheduleControls(); }} aria-label="Đóng cài đặt">×</button>
          </div>

          <SettingGroup title="Chất lượng" meta="Theo nguồn phim">
            <OptionButton label={`Tự động (${qualityLabel})`} active={quality === "auto"} onClick={() => { setQuality("auto"); setMessage("Chất lượng tự động theo đường truyền"); }} />
            <OptionButton label={`${qualityLabel} · Nguồn gốc`} active={quality === "source"} onClick={() => { setQuality("source"); setMessage(`Đang dùng chất lượng ${qualityLabel} từ nguồn`); }} />
          </SettingGroup>

          <SettingGroup title="Phụ đề" meta="Theo nội dung được cấp phép">
            <OptionButton label="Tắt" active />
            <OptionButton label="Tiếng Việt · Chưa có" disabled />
            <OptionButton label="English · Chưa có" disabled />
          </SettingGroup>

          <SettingGroup title="Âm thanh" meta="Bản âm thanh hiện có">
            <OptionButton label="Nguyên bản" active />
            <OptionButton label="Lồng tiếng Việt · Chưa có" disabled />
          </SettingGroup>

          <SettingGroup title="Tốc độ phát" meta={`${speed}×`}>
            {SPEEDS.map((item) => <OptionButton key={item} label={`${item}×`} active={speed === item} onClick={() => changeSpeed(item)} compact />)}
          </SettingGroup>

          <SettingGroup title="Khung hình" meta={viewMode === "fit" ? "Vừa khung" : viewMode === "fill" ? "Lấp đầy" : "Phóng 110%"}>
            <OptionButton label="Vừa khung" active={viewMode === "fit"} onClick={() => setViewMode("fit")} />
            <OptionButton label="Lấp đầy" active={viewMode === "fill"} onClick={() => setViewMode("fill")} />
            <OptionButton label="Phóng 110%" active={viewMode === "zoom"} onClick={() => setViewMode("zoom")} />
          </SettingGroup>

          <SettingGroup title="Chế độ hình ảnh" meta="Áp dụng tức thì">
            <OptionButton label="Tiêu chuẩn" active={pictureMode === "standard"} onClick={() => setPictureMode("standard")} />
            <OptionButton label="Điện ảnh" active={pictureMode === "cinema"} onClick={() => setPictureMode("cinema")} />
            <OptionButton label="Dịu mắt" active={pictureMode === "comfort"} onClick={() => setPictureMode("comfort")} />
          </SettingGroup>

          <p className="player-shortcuts"><kbd>Space</kbd> Phát / dừng <kbd>← →</kbd> Tua 10 giây <kbd>F</kbd> Toàn màn hình</p>
        </aside>
      )}
    </div>
  );
}

function ControlButton({ label, icon, onClick, primary = false, active = false }: { label: string; icon: IconName; onClick: () => void; primary?: boolean; active?: boolean }) {
  return <button type="button" className={`player-control ${primary ? "is-primary" : ""} ${active ? "is-active" : ""}`} onClick={onClick} aria-label={label} aria-pressed={active || undefined} title={label}><Icon name={icon} /></button>;
}

function SettingGroup({ title, meta, children }: { title: string; meta: string; children: React.ReactNode }) {
  return <section className="player-setting-group"><div><h3>{title}</h3><span>{meta}</span></div><div className="player-option-row">{children}</div></section>;
}

function OptionButton({ label, active = false, disabled = false, compact = false, onClick }: { label: string; active?: boolean; disabled?: boolean; compact?: boolean; onClick?: () => void }) {
  return <button type="button" className={`${active ? "is-active" : ""} ${compact ? "is-compact" : ""}`} disabled={disabled} onClick={onClick} aria-pressed={active}><span>{label}</span>{active && <Icon name="check" />}</button>;
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    "arrow-left": <><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></>,
    audio: <><path d="M12 6v12"/><path d="M8 9v6M4 11v2M16 8v8M20 10v4"/></>,
    captions: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 10.5a2 2 0 1 0 0 3M18 10.5a2 2 0 1 0 0 3"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    compress: <><path d="m8 3 0 5-5 0M16 3v5h5M8 21v-5H3M16 21v-5h5"/></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
    forward: <><path d="M20 5v6h-6"/><path d="M19 11a8 8 0 1 1-2-5.5"/><path d="M12 9v6M10 11l2-2"/></>,
    pause: <><path d="M9 5v14M15 5v14"/></>,
    pip: <><rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1"/></>,
    play: <path d="m9 6 9 6-9 6Z"/>,
    rewind: <><path d="M4 5v6h6"/><path d="M5 11a8 8 0 1 0 2-5.5"/><path d="M12 9v6M10 11l2-2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/></>,
    "volume-off": <><path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m16 10 5 5M21 10l-5 5"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = Math.floor(value % 60);
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

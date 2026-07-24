"use client";

import { useState, useSyncExternalStore } from "react";

export function WatchlistButton({
  movieId,
  initialSaved,
  signInUrl,
}: {
  movieId: string;
  initialSaved: boolean;
  signInUrl: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const hydrated = useSyncExternalStore(() => () => undefined, () => true, () => false);

  async function toggle() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, saved: !saved }),
      });
      if (response.status === 401) {
        window.location.assign(signInUrl);
        return;
      }
      if (!response.ok) throw new Error("save failed");
      setSaved(!saved);
      setMessage(!saved ? "Đã thêm vào Tủ phim" : "Đã xóa khỏi Tủ phim");
    } catch {
      setMessage("Chưa thể cập nhật. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="watchlist-control">
      <button className="button button-secondary" type="button" onClick={toggle} disabled={!hydrated || busy} data-ready={hydrated}>
        <span aria-hidden="true">{saved ? "✓" : "+"}</span>
        {busy ? "Đang lưu…" : saved ? "Đã lưu" : "Lưu vào Tủ phim"}
      </button>
      <span className="sr-only" aria-live="polite">{message}</span>
    </div>
  );
}

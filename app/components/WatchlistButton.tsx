"use client";

import { useState } from "react";

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
      setMessage(!saved ? "Đã thêm vào danh sách" : "Đã xóa khỏi danh sách");
    } catch {
      setMessage("Chưa thể cập nhật. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="watchlist-control">
      <button className="button button-secondary" type="button" onClick={toggle} disabled={busy}>
        <span aria-hidden="true">{saved ? "✓" : "＋"}</span>
        {busy ? "Đang lưu…" : saved ? "Đã lưu" : "Danh sách của tôi"}
      </button>
      <span className="sr-only" aria-live="polite">{message}</span>
    </div>
  );
}

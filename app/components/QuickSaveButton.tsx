"use client";

import { useState } from "react";

export function QuickSaveButton({
  movieId,
  initialSaved = false,
  compact = false,
}: {
  movieId: string;
  initialSaved?: boolean;
  compact?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggleSave() {
    if (busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/watchlist", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId, saved: !saved }),
      });
      if (response.status === 401) {
        const returnTo = `${window.location.pathname}${window.location.search}`;
        window.location.assign(`/login?${new URLSearchParams({ return_to: returnTo })}`);
        return;
      }
      if (!response.ok) throw new Error("Không thể cập nhật tủ phim");
      setSaved(!saved);
      window.dispatchEvent(new CustomEvent("cinewave:trend-signal", { detail: { movieId, type: !saved ? "saved" : "removed" } }));
    } catch {
      // Keep the previous state so a failed request never misleads the viewer.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      className={`quick-save${saved ? " is-saved" : ""}${compact ? " is-compact" : ""}`}
      type="button"
      onClick={toggleSave}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Xóa khỏi Tủ phim" : "Lưu vào Tủ phim"}
      title={saved ? "Đã lưu trong Tủ phim" : "Lưu vào Tủ phim"}
    >
      <span className="bookmark-glyph" aria-hidden="true" />
    </button>
  );
}

"use client";

import { useState } from "react";

export function ReactionBar({ movieId }: { movieId: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("Giúp CineWave hiểu gu của bạn");
  const react = async (reaction: "like" | "love" | "not_for_me") => {
    const response = await fetch("/api/reactions", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ movieId, reaction }) });
    if (!response.ok) { setMessage(response.status === 401 ? "Đăng nhập để lưu cảm nhận" : "Chưa thể lưu cảm nhận"); return; }
    setSelected(reaction); setMessage("Đã cập nhật đề xuất dành cho bạn");
  };
  return <section className="reaction-bar" aria-label="Đánh giá nội dung">
    <div><p className="eyebrow">CẢM NHẬN</p><p aria-live="polite">{message}</p></div>
    <div className="reaction-actions">
      <button className={selected === "not_for_me" ? "is-selected" : ""} onClick={() => react("not_for_me")} type="button">Không hợp gu</button>
      <button className={selected === "like" ? "is-selected" : ""} onClick={() => react("like")} type="button">Thích</button>
      <button className={selected === "love" ? "is-selected" : ""} onClick={() => react("love")} type="button">Rất thích</button>
    </div>
  </section>;
}

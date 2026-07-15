"use client";

import { useState } from "react";

export function CatalogSyncButton() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Lấy tối đa 18 phim và trailer chính thức mới nhất.");

  async function synchronize() {
    setState("loading");
    setMessage("Đang lấy metadata, ảnh và trailer…");
    try {
      const response = await fetch("/api/admin/catalog-sync", { method: "POST" });
      const payload = (await response.json()) as { imported?: number; trailerCount?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "Đồng bộ không thành công.");
      setState("success");
      setMessage(`Đã nhập ${payload.imported} phim, ${payload.trailerCount} phim có trailer.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Đồng bộ không thành công.");
    }
  }

  return (
    <div className={`catalog-sync catalog-sync-${state}`}>
      <div><p className="eyebrow">NHẬP NỘI DUNG HỢP PHÁP</p><h2>TMDB Catalog Importer</h2><p aria-live="polite">{message}</p></div>
      <button className="button button-primary" type="button" onClick={synchronize} disabled={state === "loading"}>
        {state === "loading" ? "Đang đồng bộ…" : "Đồng bộ ngay"}
      </button>
    </div>
  );
}

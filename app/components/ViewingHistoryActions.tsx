"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RemoveHistoryItem({ movieId, title }: { movieId: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const remove = () => {
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/progress", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ movieId }),
      });
      if (!response.ok) {
        setError("Chưa thể xóa. Vui lòng thử lại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="history-item-actions">
      <button className="history-remove" type="button" disabled={pending} onClick={remove}>
        {pending ? "Đang xóa…" : `Xóa ${title} khỏi lịch sử`}
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}

export function ClearViewingHistory() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const clear = () => {
    if (!window.confirm("Xóa toàn bộ lịch sử xem? Thao tác này không thể hoàn tác.")) return;
    setError("");
    startTransition(async () => {
      const response = await fetch("/api/progress", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        setError("Chưa thể xóa lịch sử. Vui lòng thử lại.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="history-clear-wrap">
      <button className="button button-secondary" type="button" disabled={pending} onClick={clear}>
        {pending ? "Đang xóa…" : "Xóa toàn bộ lịch sử"}
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}

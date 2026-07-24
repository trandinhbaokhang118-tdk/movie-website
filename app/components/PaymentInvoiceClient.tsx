"use client";

import { useEffect, useState } from "react";

function formatRemaining(expiresAt: string) {
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - Date.now()) / 1_000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PaymentInvoiceClient({ invoiceId, transferContent, expiresAt }: { invoiceId: string; transferContent: string; expiresAt: string }) {
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(() => formatRemaining(expiresAt));

  useEffect(() => {
    const clock = window.setInterval(() => setRemaining(formatRemaining(expiresAt)), 1_000);
    const polling = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${invoiceId}/status`, { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json() as { status?: string };
        if (result.status === "paid" || result.status === "expired") window.location.reload();
      } catch {
        // A brief network interruption must not break the checkout page.
      }
    }, 4_000);
    return () => { window.clearInterval(clock); window.clearInterval(polling); };
  }, [expiresAt, invoiceId]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(transferContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      // Clipboard access may be blocked by the browser; the code remains selectable.
    }
  };

  return <div className="payment-live-status"><span data-no-translate suppressHydrationWarning><i /> Đang chờ giao dịch · {remaining}</span><button type="button" onClick={copy}>{copied ? "Đã sao chép" : "Sao chép nội dung"}</button></div>;
}

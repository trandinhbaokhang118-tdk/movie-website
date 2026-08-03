import { paymentMerchant, sepayWebhookApiKey } from "../../../payment-config";
import { settlePaymentInvoice } from "@/db/runtime";

type SePayWebhook = {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: string;
  transferAmount?: number;
  referenceCode?: string;
};

export async function POST(request: Request) {
  const secret = sepayWebhookApiKey();
  if (!secret) return Response.json({ error: "Webhook is not configured" }, { status: 503 });
  if (!constantTimeEqual(request.headers.get("authorization") ?? "", `Apikey ${secret}`)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const merchant = paymentMerchant();
  if (!merchant) return Response.json({ error: "Payment merchant is not configured" }, { status: 503 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64 * 1024) return Response.json({ error: "Payload too large" }, { status: 413 });
  let payload: SePayWebhook;
  try {
    payload = await request.json() as SePayWebhook;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const transactionId = String(payload.id ?? "").trim();
  const amount = Number(payload.transferAmount);
  const transferContent = extractPaymentCode(payload.code, payload.content);
  if (!transactionId || payload.transferType !== "in" || !Number.isSafeInteger(amount) || amount <= 0 || !transferContent) {
    return Response.json({ error: "Invalid transaction" }, { status: 400 });
  }
  if (payload.accountNumber && payload.accountNumber.replace(/\s/g, "") !== merchant.accountNumber) {
    return Response.json({ error: "Unexpected beneficiary account" }, { status: 400 });
  }

  const result = await settlePaymentInvoice({
    providerTransactionId: transactionId,
    transferContent,
    amountVnd: amount,
    referenceCode: payload.referenceCode,
    payload,
  });
  if (result.outcome === "not_found" || result.outcome === "amount_mismatch" || result.outcome === "expired") {
    return Response.json({ success: false, outcome: result.outcome }, { status: 422 });
  }
  return Response.json({ success: true, outcome: result.outcome });
}

function extractPaymentCode(code?: string | null, content?: string) {
  const candidate = `${code ?? ""} ${content ?? ""}`.toUpperCase().match(/\bCW[A-Z0-9]{10}\b/)?.[0];
  return candidate ?? "";
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

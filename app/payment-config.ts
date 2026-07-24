import { env } from "cloudflare:workers";

type PaymentEnv = {
  PAYMENT_BANK_CODE?: string;
  PAYMENT_BANK_ACCOUNT?: string;
  PAYMENT_ACCOUNT_NAME?: string;
  SEPAY_WEBHOOK_API_KEY?: string;
};

export function paymentMerchant() {
  const config = env as unknown as PaymentEnv;
  return {
    bankCode: (config.PAYMENT_BANK_CODE ?? "ACB").trim().toUpperCase(),
    accountNumber: (config.PAYMENT_BANK_ACCOUNT ?? "36345057").replace(/\s/g, ""),
    accountName: (config.PAYMENT_ACCOUNT_NAME ?? "TRAN TAN PHONG").trim().toUpperCase(),
  };
}

export function sepayWebhookApiKey() {
  return ((env as unknown as PaymentEnv).SEPAY_WEBHOOK_API_KEY ?? "").trim();
}

export function vietQrImageUrl(amountVnd: number, transferContent: string) {
  const merchant = paymentMerchant();
  const query = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: transferContent,
    accountName: merchant.accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(merchant.bankCode)}-${encodeURIComponent(merchant.accountNumber)}-compact2.png?${query}`;
}

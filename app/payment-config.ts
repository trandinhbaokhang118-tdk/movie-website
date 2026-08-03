import { env } from "cloudflare:workers";

type PaymentEnv = {
  PAYMENT_BANK_CODE?: string;
  PAYMENT_BANK_ACCOUNT?: string;
  PAYMENT_ACCOUNT_NAME?: string;
  SEPAY_WEBHOOK_API_KEY?: string;
};

export function paymentMerchant() {
  const config = env as unknown as PaymentEnv;
  const merchant = {
    bankCode: (config.PAYMENT_BANK_CODE ?? "").trim().toUpperCase(),
    accountNumber: (config.PAYMENT_BANK_ACCOUNT ?? "").replace(/\s/g, ""),
    accountName: (config.PAYMENT_ACCOUNT_NAME ?? "").trim().toUpperCase(),
  };
  if (!/^[A-Z0-9]{2,12}$/.test(merchant.bankCode) || !/^\d{6,24}$/.test(merchant.accountNumber) || merchant.accountName.length < 2) return null;
  return merchant;
}

export function paymentConfigurationStatus() {
  const merchant = paymentMerchant();
  return { merchantConfigured: Boolean(merchant), webhookConfigured: Boolean(sepayWebhookApiKey()), ready: Boolean(merchant && sepayWebhookApiKey()) };
}

export function sepayWebhookApiKey() {
  return ((env as unknown as PaymentEnv).SEPAY_WEBHOOK_API_KEY ?? "").trim();
}

export function vietQrImageUrl(amountVnd: number, transferContent: string) {
  const merchant = paymentMerchant();
  if (!merchant) throw new Error("PAYMENT_NOT_CONFIGURED");
  const query = new URLSearchParams({
    amount: String(amountVnd),
    addInfo: transferContent,
    accountName: merchant.accountName,
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(merchant.bankCode)}-${encodeURIComponent(merchant.accountNumber)}-compact2.png?${query}`;
}

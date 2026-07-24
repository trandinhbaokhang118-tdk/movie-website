export const membershipPlans = [
  { code: "moon", name: "Moon", amountVnd: 79_000, quality: "Full HD", streams: 1, note: "Một màn hình, trải nghiệm không quảng cáo" },
  { code: "eclipse", name: "Eclipse", amountVnd: 149_000, quality: "2K", streams: 2, note: "Hai màn hình và âm thanh chất lượng cao" },
  { code: "constellation", name: "Constellation", amountVnd: 219_000, quality: "4K HDR", streams: 4, note: "Bốn màn hình, ưu tiên premiere và Spatial Audio" },
] as const;

export type MembershipPlanCode = (typeof membershipPlans)[number]["code"];

export function findMembershipPlan(value: string) {
  return membershipPlans.find((plan) => plan.code === value) ?? null;
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

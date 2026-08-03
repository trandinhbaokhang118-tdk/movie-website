"use server";

import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { createPaymentInvoice, ensureViewer, recordAudit } from "@/db/runtime";
import { findMembershipPlan } from "@/lib/membership";
import { paymentConfigurationStatus } from "../payment-config";

export async function createPaymentInvoiceAction(formData: FormData) {
  if (!paymentConfigurationStatus().ready) redirect("/plans?error=payment-unavailable");
  const user = await requireUser("/plans");
  const viewer = await ensureViewer(user.email, user.displayName);
  const plan = findMembershipPlan(String(formData.get("planCode") ?? ""));
  if (!plan) redirect("/plans?error=invalid-plan");
  const invoice = await createPaymentInvoice(viewer.id, plan.code, plan.amountVnd);
  await recordAudit(user.email, "payment.invoice.created", `${invoice.id}:${plan.code}`);
  redirect(`/checkout/${invoice.id}`);
}

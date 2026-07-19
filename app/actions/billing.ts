"use server";

import { revalidatePath } from "next/cache";
import { requireChatGPTUser } from "../chatgpt-auth";
import { activateSandboxPlan, ensureViewer, recordAudit } from "@/db/runtime";

export async function activatePlanAction(formData: FormData) {
  const user = await requireChatGPTUser("/plans");
  const viewer = await ensureViewer(user.email, user.displayName);
  const planCode = String(formData.get("planCode") ?? "");
  await activateSandboxPlan(viewer.id, planCode);
  await recordAudit(user.email, "subscription.sandbox.activated", planCode);
  revalidatePath("/plans");
  revalidatePath("/account");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { ensureViewer, recordAudit, updateAnalyticsConsent } from "@/db/runtime";

export async function updatePrivacyAction(formData: FormData) {
  const user = await requireUser("/account");
  const viewer = await ensureViewer(user.email, user.displayName);
  const consent = formData.get("analyticsConsent") === "on";
  await updateAnalyticsConsent(viewer.id, consent);
  await recordAudit(user.email, "privacy.analytics_consent.updated", consent ? "granted" : "withdrawn");
  revalidatePath("/account");
}

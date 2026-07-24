"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser, safeReturnPath } from "../auth";
import { ensureViewer, getActiveProfile, recordAudit, updateProfileLocale } from "@/db/runtime";
import { LOCALE_COOKIE, normalizeLocale } from "../i18n/config";

export async function updateLocaleAction(formData: FormData) {
  const locale = normalizeLocale(formData.get("locale"));
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax", maxAge: 365 * 24 * 60 * 60 });
  const user = await getCurrentUser();
  if (user) {
    const viewer = await ensureViewer(user.email, user.displayName);
    const profile = await getActiveProfile(viewer.id);
    await updateProfileLocale(viewer.id, profile.id, locale);
    await recordAudit(user.email, "profile.locale.updated", `${profile.id}:${locale}`);
  }
  revalidatePath("/", "layout");
  redirect(returnTo);
}

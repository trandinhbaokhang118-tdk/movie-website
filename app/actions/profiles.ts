"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import { createProfile, ensureViewer, recordAudit, setActiveProfile, updateProfileAppearance, updateProfilePreferences } from "@/db/runtime";
import { getActiveProfile } from "@/db/runtime";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "../i18n/config";

export async function createProfileAction(formData: FormData) {
  const user = await requireUser("/profiles");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 30) return;
  const isKids = formData.get("isKids") === "on";
  const viewer = await ensureViewer(user.email, user.displayName);
  await createProfile(viewer.id, name, isKids);
  await recordAudit(user.email, "profile.created", name);
  revalidatePath("/profiles");
}

export async function selectProfileAction(formData: FormData) {
  const user = await requireUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profileId = String(formData.get("profileId") ?? "");
  await setActiveProfile(viewer.id, profileId);
  const selectedProfile = await getActiveProfile(viewer.id);
  (await cookies()).set(LOCALE_COOKIE, normalizeLocale(selectedProfile.locale), { path: "/", sameSite: "lax", maxAge: 365 * 24 * 60 * 60 });
  await recordAudit(user.email, "profile.selected", profileId);
  revalidatePath("/");
  revalidatePath("/profiles");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profileId = String(formData.get("profileId") ?? "");
  await updateProfilePreferences(viewer.id, profileId, {
    maturity: String(formData.get("maturity") ?? "T18"),
    subtitleLanguage: String(formData.get("subtitleLanguage") ?? "vi"),
    autoplayNext: formData.get("autoplayNext") === "on",
    autoplayPreviews: formData.get("autoplayPreviews") === "on",
  });
  await recordAudit(user.email, "profile.preferences.updated", profileId);
  revalidatePath("/profiles");
}

export async function updateProfileAppearanceAction(formData: FormData) {
  const user = await requireUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profileId = String(formData.get("profileId") ?? "");
  const avatar = formData.get("avatar");
  let avatarUrl = String(formData.get("currentAvatarUrl") ?? "") || null;
  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith("image/") || avatar.size > 500_000) throw new Error("Ảnh đại diện phải là ảnh nhỏ hơn 500 KB.");
    const bytes = new Uint8Array(await avatar.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    avatarUrl = `data:${avatar.type};base64,${btoa(binary)}`;
  }
  if (formData.get("removeAvatar") === "on") avatarUrl = null;
  await updateProfileAppearance(viewer.id, profileId, {
    avatarUrl,
    avatarColor: String(formData.get("avatarColor") ?? "#8b7cff"),
    theme: String(formData.get("theme") ?? "cinewave"),
  });
  await recordAudit(user.email, "profile.appearance.updated", profileId);
  revalidatePath("/");
  revalidatePath("/profiles");
  revalidatePath("/account");
}

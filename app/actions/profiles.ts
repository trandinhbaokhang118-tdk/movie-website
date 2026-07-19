"use server";

import { revalidatePath } from "next/cache";
import { requireChatGPTUser } from "../chatgpt-auth";
import { createProfile, ensureViewer, recordAudit, setActiveProfile, updateProfilePreferences } from "@/db/runtime";

export async function createProfileAction(formData: FormData) {
  const user = await requireChatGPTUser("/profiles");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 30) return;
  const isKids = formData.get("isKids") === "on";
  const viewer = await ensureViewer(user.email, user.displayName);
  await createProfile(viewer.id, name, isKids);
  await recordAudit(user.email, "profile.created", name);
  revalidatePath("/profiles");
}

export async function selectProfileAction(formData: FormData) {
  const user = await requireChatGPTUser("/profiles");
  const viewer = await ensureViewer(user.email, user.displayName);
  const profileId = String(formData.get("profileId") ?? "");
  await setActiveProfile(viewer.id, profileId);
  await recordAudit(user.email, "profile.selected", profileId);
  revalidatePath("/");
  revalidatePath("/profiles");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireChatGPTUser("/profiles");
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

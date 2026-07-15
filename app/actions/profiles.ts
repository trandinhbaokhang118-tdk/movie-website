"use server";

import { revalidatePath } from "next/cache";
import { requireChatGPTUser } from "../chatgpt-auth";
import { createProfile, ensureViewer, recordAudit } from "@/db/runtime";

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

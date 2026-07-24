"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import {
  createManagedTitle,
  deleteManagedTitle,
  ensureViewer,
  isAdmin,
  setAccountStatus,
  setManagedTitleStatus,
  updateManagedTitle,
  type ManagedTitleInput,
} from "@/db/runtime";

async function requireAdminActor() {
  const user = await requireUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  if (!(await isAdmin(viewer.id, user.email))) throw new Error("FORBIDDEN");
  return user;
}

function cleanText(formData: FormData, key: string, max: number, required = true) {
  const value = String(formData.get(key) ?? "").trim();
  if ((required && !value) || value.length > max) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
}

function optionalUrl(formData: FormData, key: string) {
  const value = cleanText(formData, key, 1000, false);
  if (!value) return null;
  const url = new URL(value, "http://localhost");
  if (!(["http:", "https:"].includes(url.protocol) || value.startsWith("/media/"))) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
}

function requiredUrl(formData: FormData, key: string) {
  const value = cleanText(formData, key, 1000);
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
}

function titleInput(formData: FormData): ManagedTitleInput {
  const releaseYear = Number.parseInt(cleanText(formData, "releaseYear", 4), 10);
  if (releaseYear < 1888 || releaseYear > new Date().getFullYear() + 5) throw new Error("INVALID_YEAR");
  const contentType = cleanText(formData, "contentType", 10) === "series" ? "series" : "movie";
  const maturity = cleanText(formData, "maturity", 4);
  if (!new Set(["P", "K", "T13", "T16", "T18"]).has(maturity)) throw new Error("INVALID_MATURITY");
  return {
    title: cleanText(formData, "title", 120),
    originalTitle: cleanText(formData, "originalTitle", 120),
    releaseYear,
    contentType,
    genres: cleanText(formData, "genres", 160),
    maturity,
    duration: cleanText(formData, "duration", 30),
    synopsis: cleanText(formData, "synopsis", 2000),
    posterUrl: optionalUrl(formData, "posterUrl"),
    videoUrl: optionalUrl(formData, "videoUrl"),
    licenseName: cleanText(formData, "licenseName", 160),
    licenseUrl: requiredUrl(formData, "licenseUrl"),
  };
}

export async function createTitleAction(formData: FormData) {
  const actor = await requireAdminActor();
  await createManagedTitle(titleInput(formData), actor.email);
  revalidatePath("/admin");
  revalidatePath("/browse");
}

export async function updateTitleAction(formData: FormData) {
  const actor = await requireAdminActor();
  const id = cleanText(formData, "id", 80);
  await updateManagedTitle(id, titleInput(formData), actor.email);
  revalidatePath("/admin");
  revalidatePath(`/title/${id}`);
}

export async function setTitleStatusAction(formData: FormData) {
  const actor = await requireAdminActor();
  const id = cleanText(formData, "id", 80);
  const status = cleanText(formData, "status", 12);
  if (!new Set(["draft", "published", "hidden"]).has(status)) throw new Error("INVALID_STATUS");
  await setManagedTitleStatus(id, status as "draft" | "published" | "hidden", actor.email);
  revalidatePath("/admin");
  revalidatePath("/browse");
  revalidatePath(`/title/${id}`);
}

export async function deleteTitleAction(formData: FormData) {
  const actor = await requireAdminActor();
  const id = cleanText(formData, "id", 80);
  if (cleanText(formData, "confirmation", 20) !== "DELETE") throw new Error("CONFIRMATION_REQUIRED");
  await deleteManagedTitle(id, actor.email);
  revalidatePath("/admin");
  revalidatePath("/browse");
}

export async function setAccountStatusAction(formData: FormData) {
  const actor = await requireAdminActor();
  const userId = cleanText(formData, "userId", 80);
  const status = cleanText(formData, "status", 10);
  if (!new Set(["active", "locked"]).has(status)) throw new Error("INVALID_STATUS");
  await setAccountStatus(userId, status as "active" | "locked", actor.email);
  revalidatePath("/admin");
}

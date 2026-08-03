"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "../auth";
import {
  createManagedTitle,
  createEditorialContent,
  deleteManagedTitle,
  ensureViewer,
  adminRoleCan,
  getAdminRole,
  setAccountRole,
  type AdminCapability,
  setAccountStatus,
  setManagedTitleStatus,
  setEditorialStatus,
  updateManagedTitle,
  type ManagedTitleInput,
} from "@/db/runtime";
import { storeMediaUpload } from "../media-storage";

async function requireAdminActor(capability: AdminCapability) {
  const user = await requireUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  const role = await getAdminRole(viewer.id, user.email);
  if (!role || !adminRoleCan(role, capability)) throw new Error("FORBIDDEN");
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

async function titleInput(formData: FormData, actorEmail: string): Promise<ManagedTitleInput> {
  const releaseYear = Number.parseInt(cleanText(formData, "releaseYear", 4), 10);
  if (releaseYear < 1888 || releaseYear > new Date().getFullYear() + 5) throw new Error("INVALID_YEAR");
  const contentType = cleanText(formData, "contentType", 10) === "series" ? "series" : "movie";
  const maturity = cleanText(formData, "maturity", 4);
  if (!new Set(["P", "K", "T13", "T16", "T18"]).has(maturity)) throw new Error("INVALID_MATURITY");
  const posterUpload = await storeMediaUpload(formData.get("posterFile") instanceof File ? formData.get("posterFile") as File : null, "poster", actorEmail);
  const videoUpload = await storeMediaUpload(formData.get("videoFile") instanceof File ? formData.get("videoFile") as File : null, "video", actorEmail);
  const subtitleUpload = await storeMediaUpload(formData.get("subtitleFile") instanceof File ? formData.get("subtitleFile") as File : null, "subtitle", actorEmail);
  return {
    title: cleanText(formData, "title", 120),
    originalTitle: cleanText(formData, "originalTitle", 120),
    releaseYear,
    contentType,
    genres: cleanText(formData, "genres", 160),
    maturity,
    duration: cleanText(formData, "duration", 30),
    synopsis: cleanText(formData, "synopsis", 2000),
    posterUrl: posterUpload ?? optionalUrl(formData, "posterUrl"),
    videoUrl: videoUpload ?? optionalUrl(formData, "videoUrl"),
    subtitleUrl: subtitleUpload ?? optionalUrl(formData, "subtitleUrl"),
    licenseName: cleanText(formData, "licenseName", 160),
    licenseUrl: requiredUrl(formData, "licenseUrl"),
  };
}

export async function createTitleAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  await createManagedTitle(await titleInput(formData, actor.email), actor.email);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/browse");
}

export async function updateTitleAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  const id = cleanText(formData, "id", 80);
  await updateManagedTitle(id, await titleInput(formData, actor.email), actor.email);
  revalidatePath("/admin");
  revalidatePath(`/title/${id}`);
}

export async function setTitleStatusAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  const id = cleanText(formData, "id", 80);
  const status = cleanText(formData, "status", 12);
  if (!new Set(["draft", "scheduled", "published", "hidden"]).has(status)) throw new Error("INVALID_STATUS");
  const scheduledRaw = cleanText(formData, "scheduledAt", 40, false);
  const scheduledAt = scheduledRaw ? new Date(scheduledRaw).toISOString() : null;
  await setManagedTitleStatus(id, status as "draft" | "scheduled" | "published" | "hidden", actor.email, scheduledAt);
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath(`/title/${id}`);
}

export async function deleteTitleAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  const id = cleanText(formData, "id", 80);
  if (cleanText(formData, "confirmation", 20) !== "DELETE") throw new Error("CONFIRMATION_REQUIRED");
  await deleteManagedTitle(id, actor.email);
  revalidatePath("/admin");
  revalidatePath("/browse");
}

export async function setAccountStatusAction(formData: FormData) {
  const actor = await requireAdminActor("accounts");
  const userId = cleanText(formData, "userId", 80);
  const status = cleanText(formData, "status", 10);
  if (!new Set(["active", "locked"]).has(status)) throw new Error("INVALID_STATUS");
  await setAccountStatus(userId, status as "active" | "locked", actor.email);
  revalidatePath("/admin");
}

export async function setAccountRoleAction(formData: FormData) {
  const actor = await requireAdminActor("permissions");
  const userId = cleanText(formData, "userId", 80);
  const role = cleanText(formData, "role", 30);
  if (!new Set(["viewer", "super_admin", "content_manager", "support", "analyst"]).has(role)) throw new Error("INVALID_ROLE");
  await setAccountRole(userId, role as "viewer" | "super_admin" | "content_manager" | "support" | "analyst", actor.email);
  revalidatePath("/admin/accounts");
  revalidatePath("/admin/permissions");
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
}

export async function createEditorialAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  const requestedKind = cleanText(formData, "kind", 12);
  const kind = requestedKind === "program" || requestedKind === "podcast" ? requestedKind : "blog";
  const title = cleanText(formData, "title", 160);
  const scheduledRaw = cleanText(formData, "scheduledAt", 40, false);
  let scheduledAt: string | null = null;
  if (scheduledRaw) {
    const date = new Date(scheduledRaw);
    if (Number.isNaN(date.getTime())) throw new Error("INVALID_SCHEDULE");
    scheduledAt = date.toISOString();
  }
  await createEditorialContent({
    kind,
    title,
    slug: slugify(cleanText(formData, "slug", 120, false) || title),
    excerpt: cleanText(formData, "excerpt", 320),
    body: cleanText(formData, "body", 12000),
    category: cleanText(formData, "category", 80),
    coverUrl: optionalUrl(formData, "coverUrl"),
    mediaUrl: optionalUrl(formData, "mediaUrl"),
    scheduledAt,
  }, actor.email);
  revalidatePath(kind === "blog" ? "/admin/blog" : kind === "podcast" ? "/admin/podcast" : "/admin/schedule");
  revalidatePath("/admin/analytics");
}

export async function setEditorialStatusAction(formData: FormData) {
  const actor = await requireAdminActor("content");
  const id = cleanText(formData, "id", 80);
  const status = cleanText(formData, "status", 12);
  if (!new Set(["draft", "scheduled", "published", "hidden"]).has(status)) throw new Error("INVALID_STATUS");
  await setEditorialStatus(id, status as "draft" | "scheduled" | "published" | "hidden", actor.email);
  revalidatePath("/admin/blog");
  revalidatePath("/admin/schedule");
  revalidatePath("/admin/podcast");
  revalidatePath("/admin/analytics");
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { headers } from "next/headers";
import {
  createAuthSession,
  deleteAuthSession,
  findViewerBySession,
  findViewerCredentials,
  registerViewer,
  type Viewer,
} from "@/db/runtime";

export type CurrentUser = Viewer;

export const SESSION_COOKIE = "cinewave_session";
const SESSION_DAYS = 30;
const PASSWORD_ITERATIONS = 210_000;

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findViewerBySession(await sha256(token));
});

export async function requireUser(returnTo: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `/login?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

export function safeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost" || ["/login", "/register"].includes(url.pathname)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export async function registerWithPassword(input: { email: string; displayName: string; password: string }) {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  validateRegistration(email, displayName, input.password);
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const passwordSalt = toHex(saltBytes);
  const passwordHash = await derivePassword(input.password, saltBytes);
  return registerViewer(email, displayName, passwordHash, passwordSalt);
}

export async function authenticateWithPassword(email: string, password: string): Promise<Viewer | null> {
  const viewer = await findViewerCredentials(email);
  if (!viewer?.passwordHash || !viewer.passwordSalt || viewer.status !== "active") return null;
  const actual = await derivePassword(password, fromHex(viewer.passwordSalt));
  if (!constantTimeEqual(actual, viewer.passwordHash)) return null;
  return { id: viewer.id, email: viewer.email, displayName: viewer.displayName };
}

export async function startSession(userId: string) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = toBase64Url(bytes);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const requestHeaders = await headers();
  await createAuthSession(userId, await sha256(token), expires.toISOString(), {
    userAgent: requestHeaders.get("user-agent") ?? undefined,
    ipAddress: requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires,
  });
}

export async function endSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) await deleteAuthSession(await sha256(token));
  cookieStore.delete(SESSION_COOKIE);
}

export async function currentSessionHash(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? sha256(token) : null;
}

function validateRegistration(email: string, displayName: string, password: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("INVALID_EMAIL");
  if (displayName.length < 2 || displayName.length > 60) throw new Error("INVALID_NAME");
  if (password.length < 8 || password.length > 128) throw new Error("WEAK_PASSWORD");
}

async function derivePassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PASSWORD_ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % 2) return new Uint8Array();
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

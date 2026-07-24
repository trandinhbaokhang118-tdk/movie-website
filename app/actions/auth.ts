"use server";

import { redirect } from "next/navigation";
import {
  authenticateWithPassword,
  endSession,
  registerWithPassword,
  safeReturnPath,
  startSession,
} from "../auth";
import {
  deleteOtherAuthSessions,
  deleteAuthSessionById,
  ensureViewer,
  getActiveProfile,
  updateProfileLocale,
} from "@/db/runtime";
import { currentSessionHash, requireUser } from "../auth";
import { verifyTurnstile } from "../turnstile";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "../i18n/config";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  const challenge = await verifyTurnstile(formData, "login");
  if (!challenge.ok) redirect(authErrorPath("/login", challenge.message, returnTo));
  const user = await authenticateWithPassword(email, password);
  if (!user) redirect(authErrorPath("/login", "Email hoặc mật khẩu không đúng.", returnTo));
  const viewer = await ensureViewer(user.email, user.displayName);
  await endSession();
  await startSession(viewer.id);
  const profile = await getActiveProfile(viewer.id);
  (await cookies()).set(LOCALE_COOKIE, normalizeLocale(profile.locale), { path: "/", sameSite: "lax", maxAge: 365 * 24 * 60 * 60 });
  redirect(returnTo);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  const challenge = await verifyTurnstile(formData, "register");
  if (!challenge.ok) redirect(authErrorPath("/register", challenge.message, returnTo, email));
  try {
    const user = await registerWithPassword({ email, displayName, password });
    await startSession(user.id);
    const profile = await getActiveProfile(user.id);
    const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
    await updateProfileLocale(user.id, profile.id, locale);
  } catch (error) {
    console.error("Local account registration failed", error);
    const message = error instanceof Error ? registrationMessage(error.message) : "Không thể tạo tài khoản.";
    redirect(authErrorPath("/register", message, returnTo));
  }
  redirect(returnTo);
}

export async function logoutAction() {
  await endSession();
  redirect("/");
}

export async function revokeOtherSessionsAction() {
  const user = await requireUser("/account");
  const hash = await currentSessionHash();
  if (hash) await deleteOtherAuthSessions(user.id, hash);
  redirect("/account?security=updated");
}

export async function revokeSessionAction(formData: FormData) {
  const user = await requireUser("/account");
  const sessionId = String(formData.get("sessionId") ?? "");
  const currentHash = await currentSessionHash();
  if (!sessionId || !currentHash) redirect("/account?security=error");
  const { listAuthSessions } = await import("@/db/runtime");
  const target = (await listAuthSessions(user.id)).find((session) => session.id === sessionId);
  if (target && target.tokenHash !== currentHash) await deleteAuthSessionById(user.id, sessionId);
  redirect("/account?security=updated");
}

function authErrorPath(path: string, error: string, returnTo: string, email = "") {
  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
  return `${path}?error=${encodeURIComponent(error)}&return_to=${encodeURIComponent(returnTo)}${emailQuery}`;
}

function registrationMessage(code: string) {
  if (code === "EMAIL_ALREADY_REGISTERED") return "Email này đã được đăng ký.";
  if (code === "INVALID_EMAIL") return "Email chưa đúng định dạng.";
  if (code === "INVALID_NAME") return "Tên hiển thị phải có từ 2 đến 60 ký tự.";
  if (code === "WEAK_PASSWORD") return "Mật khẩu phải có ít nhất 8 ký tự.";
  return "Không thể tạo tài khoản lúc này.";
}

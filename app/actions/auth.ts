"use server";

import { redirect } from "next/navigation";
import {
  authenticateWithPassword,
  changePasswordWithCurrent,
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
  consumeRateLimit,
  anonymizeViewerAccount,
} from "@/db/runtime";
import { currentSessionHash, requireUser } from "../auth";
import { verifyTurnstile } from "../turnstile";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "../i18n/config";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  const rateLimit = await consumeRateLimit("auth.login", await authIdentity(email), 10, 15 * 60);
  if (!rateLimit.allowed) redirect(authErrorPath("/login", `Thử lại sau ${Math.ceil(rateLimit.retryAfterSeconds / 60)} phút.`, returnTo, email));
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
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? "/"));
  if (password !== confirmPassword) redirect(authErrorPath("/register", "Mật khẩu xác nhận không khớp.", returnTo, email, username));
  const rateLimit = await consumeRateLimit("auth.register", await authIdentity(email), 5, 60 * 60);
  if (!rateLimit.allowed) redirect(authErrorPath("/register", "Bạn đã tạo quá nhiều yêu cầu. Vui lòng thử lại sau.", returnTo, email, username));
  const challenge = await verifyTurnstile(formData, "register");
  if (!challenge.ok) redirect(authErrorPath("/register", challenge.message, returnTo, email, username));
  try {
    const user = await registerWithPassword({ email, displayName: username, password });
    await startSession(user.id);
    const profile = await getActiveProfile(user.id);
    const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
    await updateProfileLocale(user.id, profile.id, locale);
  } catch (error) {
    console.error("Local account registration failed", error);
    const message = error instanceof Error ? registrationMessage(error.message) : "Không thể tạo tài khoản.";
    redirect(authErrorPath("/register", message, returnTo, email, username));
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

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser("/account");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (newPassword !== confirmation) redirect("/account?password=confirmation");
  try {
    await changePasswordWithCurrent(user.id, user.email, currentPassword, newPassword);
    const currentHash = await currentSessionHash();
    if (currentHash) await deleteOtherAuthSessions(user.id, currentHash);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    const result = code === "CURRENT_PASSWORD_INVALID" ? "current" : code === "PASSWORD_UNCHANGED" ? "unchanged" : "weak";
    redirect(`/account?password=${result}`);
  }
  redirect("/account?password=updated");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser("/account");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim().toUpperCase();
  if (confirmation !== "XOA TAI KHOAN") redirect("/account?delete=confirmation");
  const verified = await authenticateWithPassword(user.email, password);
  if (!verified || verified.id !== user.id) redirect("/account?delete=password");
  await anonymizeViewerAccount(user.id);
  await endSession();
  redirect("/?account=deleted");
}

function authErrorPath(path: string, error: string, returnTo: string, email = "", username = "") {
  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : "";
  const usernameQuery = username ? `&username=${encodeURIComponent(username)}` : "";
  return `${path}?error=${encodeURIComponent(error)}&return_to=${encodeURIComponent(returnTo)}${emailQuery}${usernameQuery}`;
}

function registrationMessage(code: string) {
  if (code === "EMAIL_ALREADY_REGISTERED") return "Email này đã được đăng ký.";
  if (code === "INVALID_EMAIL") return "Email chưa đúng định dạng.";
  if (code === "INVALID_NAME") return "Tên đăng nhập phải có từ 2 đến 60 ký tự.";
  if (code === "WEAK_PASSWORD") return "Mật khẩu phải có ít nhất 10 ký tự, gồm chữ và số.";
  return "Không thể tạo tài khoản lúc này.";
}

async function authIdentity(email: string) {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("cf-connecting-ip") ?? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${ip}:${email.trim().toLowerCase()}`;
}

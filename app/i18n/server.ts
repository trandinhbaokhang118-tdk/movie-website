import { cookies } from "next/headers";
import { LOCALE_COOKIE, normalizeLocale } from "./config";

export async function getCurrentLocale() {
  return normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

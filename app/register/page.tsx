import { redirect } from "next/navigation";
import { AuthExperience } from "../components/AuthExperience";
import { getCurrentUser, safeReturnPath } from "../auth";
import { getTurnstileSiteKey, shouldRenderTurnstileChallenge } from "../turnstile";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string; email?: string; username?: string }> }) {
  const params = await searchParams;
  const returnTo = safeReturnPath(params.return_to ?? "/");
  if (await getCurrentUser()) redirect(returnTo);
  return <main className="auth-page auth-page-overlay"><AuthExperience siteKey={getTurnstileSiteKey()} renderChallenge={shouldRenderTurnstileChallenge()} initialMode="register" initialOpen standalone returnTo={returnTo} error={params.error} defaultEmail={params.email} defaultUsername={params.username} /></main>;
}

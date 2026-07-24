import { AuthExperience } from "../components/AuthExperience";
import { getCurrentUser, safeReturnPath } from "../auth";
import { getTurnstileSiteKey, shouldRenderTurnstileChallenge } from "../turnstile";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string; email?: string }> }) {
  const params = await searchParams;
  const currentUser = await getCurrentUser();
  return <main className="auth-page auth-page-overlay"><AuthExperience siteKey={getTurnstileSiteKey()} renderChallenge={shouldRenderTurnstileChallenge()} initialMode="login" initialOpen standalone returnTo={safeReturnPath(params.return_to ?? "/")} error={params.error} defaultEmail={params.email} currentEmail={currentUser?.email} /></main>;
}

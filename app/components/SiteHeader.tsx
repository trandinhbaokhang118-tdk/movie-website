import { getViewerContext } from "../viewer-context";
import { Brand } from "./Brand";
import { HeaderSearch } from "./HeaderSearch";
import { HeaderExperience } from "./HeaderExperience";
import { HeaderNav } from "./HeaderNav";
import { getSubscription } from "@/db/runtime";

export async function SiteHeader({ initialSearchQuery = "" }: { initialSearchQuery?: string } = {}) {
  const context = await getViewerContext();
  const subscription = context ? await getSubscription(context.viewer.id) : null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <HeaderNav />
        <div className="header-actions">
          <HeaderSearch initialQuery={initialSearchQuery} />
          <HeaderExperience viewer={context ? {
            displayName: context.user.displayName,
            profileName: context.profile.name,
            avatarColor: context.profile.avatarColor,
            avatarUrl: context.profile.avatarUrl,
            currentPlan: subscription?.status === "active" ? subscription.planCode : null,
          } : null} />
        </div>
      </div>
    </header>
  );
}

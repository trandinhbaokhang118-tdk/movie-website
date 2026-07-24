import { cache } from "react";
import { getCurrentUser } from "./auth";
import { getActiveProfile } from "@/db/runtime";

export const getViewerContext = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getActiveProfile(user.id);
  return { user, viewer: user, profile };
});

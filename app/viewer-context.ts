import { getChatGPTUser } from "./chatgpt-auth";
import { ensureViewer, getActiveProfile } from "@/db/runtime";

export async function getViewerContext() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const viewer = await ensureViewer(user.email, user.displayName);
  const profile = await getActiveProfile(viewer.id);
  return { user, viewer, profile };
}

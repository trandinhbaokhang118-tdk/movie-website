import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { adminRoleCan, ensureViewer, getAdminRole, type AdminCapability } from "@/db/runtime";

export async function requireAdminCapability(capability: AdminCapability) {
  const user = await requireUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  const role = await getAdminRole(viewer.id, user.email);
  if (!role || !adminRoleCan(role, capability)) redirect("/admin?access=denied");
  return { user, viewer, role };
}

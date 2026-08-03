import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { adminRoleCan, ensureViewer, getAdminRole, type AdminCapability } from "@/db/runtime";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  const role = await getAdminRole(viewer.id, user.email);
  if (!role) redirect("/account");
  const allCapabilities: AdminCapability[] = ["overview", "analytics", "content", "accounts", "permissions", "system", "audit"];
  const capabilities = allCapabilities.filter((capability) => adminRoleCan(role, capability));
  return <AdminShell displayName={user.displayName} role={role} capabilities={capabilities}>{children}</AdminShell>;
}

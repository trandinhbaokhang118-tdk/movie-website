import { redirect } from "next/navigation";
import { requireUser } from "../auth";
import { ensureViewer, isAdmin } from "@/db/runtime";
import { AdminShell } from "./AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  const viewer = await ensureViewer(user.email, user.displayName);
  if (!(await isAdmin(viewer.id, user.email))) redirect("/account");
  return <AdminShell displayName={user.displayName}>{children}</AdminShell>;
}

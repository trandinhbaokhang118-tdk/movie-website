import { getCurrentUser } from "../../../../auth";
import { ensureViewer, getPaymentInvoiceForUser } from "@/db/runtime";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const viewer = await ensureViewer(user.email, user.displayName);
  const { id } = await params;
  const invoice = await getPaymentInvoiceForUser(id, viewer.id);
  if (!invoice) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ status: invoice.status, paidAt: invoice.paidAt }, { headers: { "cache-control": "no-store" } });
}

import { getCurrentUser } from "@/app/auth";
import { getUserDataExport } from "@/db/runtime";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });
  const payload = await getUserDataExport(user.id);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="cinewave-data-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/auth";
import { adminRoleCan, ensureViewer, getAdminRole, recordCatalogSync } from "@/db/runtime";
import { syncTmdbCatalog } from "@/lib/tmdb/sync";
import { isTrustedMutation } from "@/app/lib/request-security";

export async function POST(request: Request) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Yêu cầu khác nguồn đã bị từ chối." }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập để đồng bộ catalog." }, { status: 401 });
  const viewer = await ensureViewer(user.email, user.displayName);
  const role = await getAdminRole(viewer.id, user.email);
  if (!role || !adminRoleCan(role, "content")) {
    return NextResponse.json({ error: "Bạn không có quyền quản trị catalog." }, { status: 403 });
  }

  try {
    const result = await syncTmdbCatalog(18);
    await recordCatalogSync(user.email, "success", result.imported, result.trailerCount);
    return NextResponse.json({ imported: result.imported, trailerCount: result.trailerCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Đồng bộ catalog không thành công.";
    await recordCatalogSync(user.email, "failed", 0, 0, message).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

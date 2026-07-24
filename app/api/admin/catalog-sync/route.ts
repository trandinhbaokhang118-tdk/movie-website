import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/auth";
import { ensureViewer, isAdmin, recordCatalogSync } from "@/db/runtime";
import { syncTmdbCatalog } from "@/lib/tmdb/sync";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập để đồng bộ catalog." }, { status: 401 });
  const viewer = await ensureViewer(user.email, user.displayName);
  if (!(await isAdmin(viewer.id, user.email))) {
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

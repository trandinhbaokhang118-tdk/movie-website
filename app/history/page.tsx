import Link from "next/link";
import { requireChatGPTUser } from "../chatgpt-auth";
import { Footer } from "../components/Footer";
import { MediaCard } from "../components/MediaCard";
import { SiteHeader } from "../components/SiteHeader";
import { ClearViewingHistory, RemoveHistoryItem } from "../components/ViewingHistoryActions";
import { ensureViewer, listViewingActivity } from "@/db/runtime";
import { demoVideo, movies } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ViewingHistoryPage() {
  const user = await requireChatGPTUser("/history");
  const viewer = await ensureViewer(user.email, user.displayName);
  const activity = await listViewingActivity(viewer.id);
  const history = activity.flatMap((item) => {
    const movie = movies.find((candidate) => candidate.id === item.movieId);
    return movie ? [{ ...item, movie }] : [];
  });

  return (
    <main>
      <SiteHeader />
      <section className="library-page page-shell">
        <div className="history-heading">
          <div>
            <p className="eyebrow">HOẠT ĐỘNG XEM</p>
            <h1>Lịch sử xem</h1>
            <p>Xem lại, tiếp tục hoặc chủ động xóa hoạt động đã lưu trong tài khoản.</p>
          </div>
          {history.length ? <ClearViewingHistory /> : null}
        </div>

        {history.length ? (
          <div className="catalog-grid personal-grid history-grid">
            {history.map(({ movie, positionSeconds, updatedAt }) => (
              <div className="history-item" key={movie.id}>
                <MediaCard
                  movie={movie}
                  href={`/watch/${movie.id}`}
                  progress={progressPercent(positionSeconds)}
                />
                <p className="history-date">Xem gần nhất {formatDate(updatedAt)}</p>
                <RemoveHistoryItem movieId={movie.id} title={movie.title} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">▶</span>
            <h2>Chưa có lịch sử xem</h2>
            <p>Khi bạn bắt đầu xem, tiến độ và hoạt động gần đây sẽ xuất hiện tại đây.</p>
            <Link className="button button-primary" href="/browse">Khám phá thư viện</Link>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}

function progressPercent(positionSeconds: number) {
  return Math.min(100, Math.max(1, Math.round((positionSeconds / demoVideo.durationSeconds) * 100)));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}

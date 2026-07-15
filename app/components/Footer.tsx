import Link from "next/link";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <Brand />
          <p>Những câu chuyện đáng nhớ, phát theo cách bạn muốn.</p>
        </div>
        <div>
          <h2>Khám phá</h2>
          <Link href="/browse">Phim & series</Link>
          <Link href="/search">Tìm kiếm</Link>
          <Link href="/my-list">Danh sách của tôi</Link>
        </div>
        <div>
          <h2>Thông tin</h2>
          <Link href="/about">Về CineWave</Link>
          <Link href="/account">Tài khoản</Link>
          <span>Nội dung demo hợp pháp</span>
        </div>
      </div>
      <p className="footer-note">© 2026 CineWave. Bản dựng production MVP.</p>
    </footer>
  );
}

import Link from "next/link";
import { Brand } from "./components/Brand";

export default function NotFound() {
  return (
    <main className="not-found">
      <Brand />
      <p className="error-code">404</p>
      <h1>Câu chuyện này chưa có trên CineWave</h1>
      <p>Liên kết có thể đã thay đổi hoặc nội dung hiện không khả dụng.</p>
      <Link className="button button-primary" href="/browse">Về thư viện phim</Link>
    </main>
  );
}

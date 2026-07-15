import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <section className="about-page page-shell">
        <p className="eyebrow">CINEWAVE ORIGINAL</p>
        <h1>Một rạp phim riêng, được xây quanh khoảnh khắc bạn nhấn Play.</h1>
        <p className="about-lead">CineWave là bản production MVP cho nền tảng VOD hợp pháp: khám phá nhanh, xem liền mạch và minh bạch về quyền truy cập.</p>
        <div className="values-grid"><article><span>01</span><h2>Chọn nhanh</h2><p>Catalog có chủ đích, tìm kiếm rõ ràng và đề xuất luôn có phương án dự phòng.</p></article><article><span>02</span><h2>Xem liền mạch</h2><p>Player thật, tiến độ được lưu và trải nghiệm ưu tiên khả năng truy cập.</p></article><article><span>03</span><h2>Vận hành an toàn</h2><p>Dữ liệu cá nhân có chủ sở hữu, nội dung demo hợp pháp và trạng thái có thể kiểm tra.</p></article></div>
      </section>
      <Footer />
    </main>
  );
}

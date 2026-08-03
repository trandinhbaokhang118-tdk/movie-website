import Link from "next/link";
import Image from "next/image";
import type { Movie } from "@/lib/catalog";
import { Brand } from "./Brand";
import { AuthExperience } from "./AuthExperience";
import { getTurnstileSiteKey, shouldRenderTurnstileChallenge } from "../turnstile";
import { HeaderSearch } from "./HeaderSearch";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { PosterArtwork } from "./PosterArtwork";
import { getCurrentLocale } from "../i18n/server";

const benefits = [
  { icon: "▶", title: "Xem phim thật, miễn phí", copy: "Phát trực tiếp các phim mở đã xác minh từ Internet Archive, không dùng nguồn lậu." },
  { icon: "◎", title: "Tiếp tục trên mọi màn hình", copy: "Tiến độ xem được lưu theo hồ sơ trong database và sẵn sàng khi bạn quay lại." },
  { icon: "✦", title: "Chọn phim theo đêm", copy: "Night Compass gợi ý nội dung theo tâm trạng và khoảng thời gian bạn còn lại." },
  { icon: "♙", title: "Hồ sơ riêng cho gia đình", copy: "Tách danh sách, lịch sử, độ tuổi và tùy chọn phát cho từng người xem." },
];

const faqs = [
  ["CineWave là gì?", "CineWave là không gian xem phim ban đêm với catalog tuyển chọn, hồ sơ cá nhân, danh sách lưu và tiến độ xem đồng bộ."],
  ["Tôi có phải trả phí không?", "Không. Bản localhost hiện phát các phim Creative Commons hoặc nội dung thuộc phạm vi công cộng đã được kiểm chứng."],
  ["Phim có xem thật được không?", "Có. Các tựa phim có nút Xem ngay phát tệp MP4 thật từ nguồn được ghi rõ trên trang minh bạch bản quyền."],
  ["Tôi có thể xem ở đâu?", "Bạn có thể mở CineWave trên trình duyệt máy tính, máy tính bảng hoặc điện thoại cùng mạng với máy chủ localhost."],
  ["CineWave lưu dữ liệu gì?", "Tài khoản, hồ sơ, danh sách, tiến độ và phiên đăng nhập được lưu trong database D1 cục bộ. Mật khẩu không được lưu dưới dạng văn bản."],
  ["Nội dung có phù hợp với trẻ em?", "Mỗi hồ sơ có giới hạn độ tuổi. CineWave kiểm tra phân loại trước khi cấp quyền phát phim."],
];

export async function LandingPage({ movies }: { movies: Movie[] }) {
  const locale = await getCurrentLocale();
  const showcase = movies.slice(0, 6);
  // Keep the landing rail focused on a consistent top-ten selection. The
  // licensed catalog currently has eleven playable titles, so this remains
  // resilient as more titles are added while always rendering ten cards.
  const trendingMovies = movies.slice(0, 10);
  const mosaic = showcase.length ? Array.from({ length: 12 }, (_, index) => showcase[index % showcase.length]) : [];
  return (
    <main className="landing-page">
      <a className="skip-link" href="#landing-content">Bỏ qua đến nội dung chính</a>
      <section className="landing-hero">
        <div className="landing-mosaic" aria-hidden="true">
          {mosaic.map((movie, index) => (
            <div className="mosaic-tile" key={`${movie.id}-${index}`}>
              <Image src={index % 3 === 0 ? movie.backdrop : movie.poster} alt="" fill sizes="20vw" priority={index < 2} />
            </div>
          ))}
        </div>
        <div className="landing-scrim" />
        <header className="landing-nav page-shell">
          <Brand />
          <div><HeaderSearch /><LocaleSwitcher locale={locale} compact /><AuthExperience siteKey={getTurnstileSiteKey()} renderChallenge={shouldRenderTurnstileChallenge()} /></div>
        </header>
        <div className="landing-hero-copy page-shell">
          <p className="eyebrow">CINEWAVE · RẠP PHIM SAU NỬA ĐÊM</p>
          <h1>Phim thật để xem.<br />Không gian để đắm chìm.</h1>
          <p className="landing-lead">Những phim mở được tuyển chọn, trải nghiệm cá nhân hóa và mọi bằng chứng bản quyền đều minh bạch.</p>
          <p className="landing-prompt">Sẵn sàng bước vào? Nhập email để tạo tài khoản miễn phí.</p>
          <form className="landing-email-form" action="/register">
            <label className="sr-only" htmlFor="landing-email">Địa chỉ email</label>
            <input id="landing-email" name="email" type="email" autoComplete="email" placeholder="Địa chỉ email" required />
            <button className="button button-primary" type="submit">Bắt đầu <span>→</span></button>
          </form>
          {showcase[5] ? <Link className="landing-demo-link" href={`/title/${showcase[5].id}`}><span aria-hidden="true">▶</span> Xem phim demo thật ngay</Link> : null}
        </div>
        <div className="landing-arc" aria-hidden="true" />
      </section>

      <div className="landing-body page-shell" id="landing-content">
        <section className="landing-section" aria-labelledby="trending-title">
          <div className="landing-section-heading"><p className="eyebrow">TUYỂN CHỌN HỢP PHÁP</p><h2 id="trending-title">Đang thịnh hành</h2></div>
          <div className="ranking-marquee" aria-label="Top 10 phim đang thịnh hành">
            <div className="ranking-track">
              {trendingMovies.map((movie, index) => (
                <Link className="ranking-card" href={`/title/${movie.id}`} aria-label={`Hạng ${index + 1} — ${movie.title}`} key={movie.id}>
                  <span className="ranking-number" aria-hidden="true">{index + 1}</span>
                  <div><PosterArtwork src={movie.poster} title={movie.title} alt={`Poster ${movie.title}`} sizes="(max-width: 760px) 46vw, 230px" /><span className="ranking-play">▶</span></div>
                  <h3>{movie.title}</h3>
                </Link>
              ))}
              <div className="ranking-duplicate" aria-hidden="true">
                {trendingMovies.map((movie, index) => (
                  <Link className="ranking-card" href={`/title/${movie.id}`} tabIndex={-1} key={`duplicate-${movie.id}`}>
                    <span className="ranking-number" aria-hidden="true">{index + 1}</span>
                    <div><PosterArtwork src={movie.poster} title={movie.title} alt="" sizes="(max-width: 760px) 46vw, 230px" /><span className="ranking-play">▶</span></div>
                    <h3>{movie.title}</h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" aria-labelledby="benefits-title">
          <div className="landing-section-heading"><p className="eyebrow">VÌ SAO CHỌN CINEWAVE</p><h2 id="benefits-title">Một rạp phim được xây quanh bạn</h2></div>
          <div className="benefit-grid">
            {benefits.map((benefit) => <article key={benefit.title}><span aria-hidden="true">{benefit.icon}</span><h3>{benefit.title}</h3><p>{benefit.copy}</p></article>)}
          </div>
        </section>

        <section className="landing-section faq-section" aria-labelledby="faq-title">
          <div className="landing-section-heading"><p className="eyebrow">GIẢI ĐÁP</p><h2 id="faq-title">Câu hỏi thường gặp</h2></div>
          <div className="faq-list">
            {faqs.map(([question, answer]) => <details key={question} suppressHydrationWarning><summary>{question}<span aria-hidden="true">＋</span></summary><p>{answer}</p></details>)}
          </div>
        </section>

        <section className="landing-final-cta">
          <p className="eyebrow">ĐÊM NAY XEM GÌ?</p><h2>Bắt đầu câu chuyện đầu tiên.</h2><p>Tạo tài khoản để lưu danh sách, hồ sơ và tiến độ xem.</p>
          <form className="landing-email-form" action="/register">
            <label className="sr-only" htmlFor="landing-email-bottom">Địa chỉ email</label>
            <input id="landing-email-bottom" name="email" type="email" autoComplete="email" placeholder="Địa chỉ email" required />
            <button className="button button-primary" type="submit">Tạo tài khoản <span>→</span></button>
          </form>
        </section>
      </div>

      <footer className="landing-footer page-shell">
        <div><Brand /><p>Phim mở. Đêm sâu. Mọi quyền đều minh bạch.</p></div>
        <nav aria-label="Liên kết cuối trang"><Link href="/about">Về CineWave</Link><Link href="/browse">Kho phim</Link><Link href="/plans">Gói xem</Link><Link href="/account">Tài khoản</Link><Link href="/login">Đăng nhập</Link><Link href="/register">Đăng ký</Link></nav>
        <p>© 2026 CineWave · Vận hành độc lập trên localhost.</p>
      </footer>
    </main>
  );
}

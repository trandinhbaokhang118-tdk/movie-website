import Link from "next/link";

export default function OfflinePage() {
  return <main className="watch-error"><div><p className="eyebrow">CINEWAVE OFFLINE</p><h1>Kết nối đang gián đoạn.</h1><p>Hãy kiểm tra mạng rồi thử lại. Tiến độ xem gần nhất đã được lưu khi thiết bị còn kết nối.</p><div className="hero-actions"><Link className="button button-primary" href="/browse">Thử kết nối lại</Link><Link className="button button-secondary" href="/">Về trang chủ</Link></div></div></main>;
}

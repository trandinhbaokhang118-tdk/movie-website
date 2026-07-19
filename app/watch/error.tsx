"use client";

import Link from "next/link";

export default function WatchError({ error, reset }: { error: Error; reset: () => void }) {
  const messages: Record<string, string> = {
    PROFILE_RESTRICTED: "Nội dung này vượt quá giới hạn độ tuổi của hồ sơ đang dùng.",
    SUBSCRIPTION_REQUIRED: "Bạn cần một gói thành viên còn hiệu lực để tiếp tục xem.",
    STREAM_LIMIT_REACHED: "Gói hiện tại đã dùng hết số màn hình xem đồng thời.",
    RIGHTS_NOT_AVAILABLE: "Tựa phim này chưa có đủ quyền phát hành hoặc tài sản phát hợp lệ.",
  };
  return <main className="watch-error"><div>
    <p className="eyebrow">KHÔNG THỂ BẮT ĐẦU PHIÊN XEM</p><h1>Ánh đèn chưa thể bật</h1>
    <p>{messages[error.message] ?? "Phiên xem chưa sẵn sàng. Vui lòng thử lại sau ít phút."}</p>
    <div className="hero-actions"><button className="button button-primary" onClick={reset} type="button">Thử lại</button><Link className="button button-secondary" href="/plans">Xem gói thành viên</Link><Link className="button button-secondary" href="/browse">Trở lại thư viện</Link></div>
  </div></main>;
}

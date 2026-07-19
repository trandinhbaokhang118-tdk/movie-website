import { activatePlanAction } from "../actions/billing";
import { requireChatGPTUser } from "../chatgpt-auth";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { ensureViewer, getSubscription } from "@/db/runtime";

export const dynamic = "force-dynamic";

const plans = [
  { code: "moon", name: "Moon", price: "79.000đ", quality: "Full HD", streams: 1, note: "Một màn hình, trải nghiệm không quảng cáo" },
  { code: "eclipse", name: "Eclipse", price: "149.000đ", quality: "2K", streams: 2, note: "Hai màn hình và âm thanh chất lượng cao" },
  { code: "constellation", name: "Constellation", price: "219.000đ", quality: "4K HDR", streams: 4, note: "Bốn màn hình, ưu tiên premiere và Spatial Audio" },
];

export default async function PlansPage() {
  const user = await requireChatGPTUser("/plans");
  const viewer = await ensureViewer(user.email, user.displayName);
  const subscription = await getSubscription(viewer.id);
  return <main><SiteHeader /><section className="plans-page page-shell">
    <p className="eyebrow">THÀNH VIÊN CINEWAVE</p><h1>Chọn cách bạn bước vào bóng tối</h1>
    <p className="plans-intro">Mọi gói đều không quảng cáo và có thể hủy bất kỳ lúc nào. Thanh toán hiện chạy ở chế độ sandbox; chưa thu tiền thật.</p>
    <div className="plans-grid">{plans.map((plan) => <article className={`plan-card ${subscription?.planCode === plan.code ? "is-current" : ""}`} key={plan.code}>
      <p className="eyebrow">{plan.quality}</p><h2>{plan.name}</h2><strong>{plan.price}<small>/tháng</small></strong><p>{plan.note}</p>
      <ul><li>{plan.streams} luồng xem đồng thời</li><li>Hồ sơ riêng và kiểm soát trẻ em</li><li>Tải xuống khi ứng dụng di động sẵn sàng</li></ul>
      <form action={activatePlanAction}><input type="hidden" name="planCode" value={plan.code} /><button className="button button-primary" type="submit" disabled={subscription?.planCode === plan.code}>{subscription?.planCode === plan.code ? "Gói hiện tại" : "Dùng thử sandbox"}</button></form>
    </article>)}</div>
    <aside className="sandbox-notice"><strong>Minh bạch thanh toán</strong><p>Đây là luồng kiểm thử nghiệp vụ. Trước khi mở bán cần kết nối hosted checkout, xác minh webhook và chính sách thuế của nhà cung cấp được chọn.</p></aside>
  </section><Footer /></main>;
}

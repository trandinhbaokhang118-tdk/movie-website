import Link from "next/link";
import { createPaymentInvoiceAction } from "../actions/billing";
import { requireUser } from "../auth";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { ensureViewer, getLatestPendingPaymentInvoice, getSubscription } from "@/db/runtime";
import { formatVnd, membershipPlans } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const user = await requireUser("/plans");
  const viewer = await ensureViewer(user.email, user.displayName);
  const [subscription, pendingInvoice] = await Promise.all([
    getSubscription(viewer.id),
    getLatestPendingPaymentInvoice(viewer.id),
  ]);
  return <main><SiteHeader /><section className="plans-page page-shell">
    <p className="eyebrow">THÀNH VIÊN CINEWAVE</p><h1>Chọn cách bạn bước vào bóng tối</h1>
    <p className="plans-intro">Chọn gói, quét VietQR và chờ hệ thống đối soát giao dịch. Mỗi hóa đơn có số tiền cùng mã chuyển khoản riêng.</p>
    {pendingInvoice ? <aside className="pending-payment-banner"><div><span>HÓA ĐƠN ĐANG CHỜ</span><strong>{pendingInvoice.transferContent}</strong><p>Hoàn tất thanh toán trước khi tạo hóa đơn mới.</p></div><Link className="button button-secondary" href={`/checkout/${pendingInvoice.id}`}>Mở hóa đơn →</Link></aside> : null}
    <div className="plans-grid">{membershipPlans.map((plan) => <article className={`plan-card ${subscription?.planCode === plan.code ? "is-current" : ""}`} key={plan.code}>
      <p className="eyebrow">{plan.quality}</p><h2>{plan.name}</h2><strong>{formatVnd(plan.amountVnd)}<small>/tháng</small></strong><p>{plan.note}</p>
      <ul><li>{plan.streams} luồng xem đồng thời</li><li>Hồ sơ riêng và kiểm soát trẻ em</li><li>Thanh toán VietQR có mã đối soát</li></ul>
      <form action={createPaymentInvoiceAction}><input type="hidden" name="planCode" value={plan.code} /><button className="button button-primary" type="submit" disabled={subscription?.planCode === plan.code}>{subscription?.planCode === plan.code ? "Gói hiện tại" : "Tạo QR thanh toán"}</button></form>
    </article>)}</div>
    <aside className="sandbox-notice payment-real-notice"><strong>Lưu ý giao dịch thật</strong><p>QR chuyển tiền đến tài khoản ACB được cung cấp. Gói chỉ kích hoạt sau khi webhook SePay xác nhận đúng mã hóa đơn và đúng số tiền; localhost không thể tự nhận webhook từ Internet nếu chưa có URL công khai.</p></aside>
  </section><Footer /></main>;
}

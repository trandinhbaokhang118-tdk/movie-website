import Link from "next/link";
import { createPaymentInvoiceAction } from "../actions/billing";
import { requireUser } from "../auth";
import { Footer } from "../components/Footer";
import { SiteHeader } from "../components/SiteHeader";
import { ensureViewer, getLatestPendingPaymentInvoice, getSubscription } from "@/db/runtime";
import { formatVnd, membershipPlans } from "@/lib/membership";
import { paymentConfigurationStatus } from "../payment-config";

export const dynamic = "force-dynamic";

export default async function PlansPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const user = await requireUser("/plans");
  const viewer = await ensureViewer(user.email, user.displayName);
  const [subscription, pendingInvoice] = await Promise.all([
    getSubscription(viewer.id),
    getLatestPendingPaymentInvoice(viewer.id),
  ]);
  const payment = paymentConfigurationStatus();
  return <main><SiteHeader /><section className="plans-page page-shell">
    <p className="eyebrow">THÀNH VIÊN CINEWAVE</p><h1>Chọn cách bạn bước vào bóng tối</h1>
    <p className="plans-intro">Chọn gói, quét VietQR và chờ hệ thống đối soát giao dịch. Mỗi hóa đơn có số tiền cùng mã chuyển khoản riêng.</p>
    {!payment.ready || params.error === "payment-unavailable" ? <aside className="pending-payment-banner"><div><span>THANH TOÁN TẠM DỪNG</span><strong>Chưa hoàn tất cấu hình đối soát</strong><p>Bạn vẫn có thể xem catalog và quản lý tài khoản. Thanh toán sẽ mở lại khi thông tin VietQR và khóa webhook được xác minh.</p></div></aside> : null}
    {pendingInvoice ? <aside className="pending-payment-banner"><div><span>HÓA ĐƠN ĐANG CHỜ</span><strong>{pendingInvoice.transferContent}</strong><p>Hoàn tất thanh toán trước khi tạo hóa đơn mới.</p></div><Link className="button button-secondary" href={`/checkout/${pendingInvoice.id}`}>Mở hóa đơn →</Link></aside> : null}
    <div className="plans-grid">{membershipPlans.map((plan) => <article className={`plan-card ${subscription?.planCode === plan.code ? "is-current" : ""}`} key={plan.code}>
      <p className="eyebrow">{plan.quality}</p><h2>{plan.name}</h2><strong>{formatVnd(plan.amountVnd)}<small>/tháng</small></strong><p>{plan.note}</p>
      <ul><li>{plan.streams} luồng xem đồng thời</li><li>Hồ sơ riêng và kiểm soát trẻ em</li><li>Thanh toán VietQR có mã đối soát</li></ul>
      <form action={createPaymentInvoiceAction}><input type="hidden" name="planCode" value={plan.code} /><button className="button button-primary" type="submit" disabled={subscription?.planCode === plan.code || !payment.ready}>{subscription?.planCode === plan.code ? "Gói hiện tại" : payment.ready ? "Tạo QR thanh toán" : "Thanh toán tạm dừng"}</button></form>
    </article>)}</div>
    <aside className="sandbox-notice payment-real-notice"><strong>Đối soát giao dịch</strong><p>Gói chỉ kích hoạt sau khi webhook SePay xác nhận đúng tài khoản thụ hưởng, mã hóa đơn và số tiền. Hệ thống không tự kích hoạt dựa trên ảnh biên lai.</p></aside>
  </section><Footer /></main>;
}

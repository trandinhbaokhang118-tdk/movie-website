/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "../../auth";
import { Footer } from "../../components/Footer";
import { PaymentInvoiceClient } from "../../components/PaymentInvoiceClient";
import { SiteHeader } from "../../components/SiteHeader";
import { paymentMerchant, vietQrImageUrl } from "../../payment-config";
import { ensureViewer, getPaymentInvoiceForUser } from "@/db/runtime";
import { findMembershipPlan, formatVnd } from "@/lib/membership";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/checkout/${id}`);
  const viewer = await ensureViewer(user.email, user.displayName);
  const invoice = await getPaymentInvoiceForUser(id, viewer.id);
  if (!invoice) notFound();
  const plan = findMembershipPlan(invoice.planCode);
  if (!plan) notFound();
  const merchant = paymentMerchant();

  if (invoice.status === "paid") return <main><SiteHeader /><section className="checkout-result page-shell"><span className="checkout-result-icon">✓</span><p className="eyebrow">THANH TOÁN THÀNH CÔNG</p><h1>Đêm phim đã được mở khóa.</h1><p>Hóa đơn {invoice.transferContent} đã được SePay đối soát. Gói {plan.name} đang hoạt động trên tài khoản {user.email}.</p><div className="hero-actions"><Link className="button button-primary" href="/browse">Xem phim ngay</Link><Link className="button button-secondary" href="/account">Xem tài khoản</Link></div></section><Footer /></main>;

  if (invoice.status !== "pending") return <main><SiteHeader /><section className="checkout-result page-shell"><span className="checkout-result-icon is-expired">!</span><p className="eyebrow">HÓA ĐƠN ĐÃ HẾT HẠN</p><h1>Tạo một mã thanh toán mới.</h1><p>Không chuyển tiền bằng mã cũ vì hệ thống sẽ không tự kích hoạt gói.</p><Link className="button button-primary" href="/plans">Trở lại chọn gói</Link></section><Footer /></main>;

  if (!merchant) return <main><SiteHeader /><section className="checkout-result page-shell"><span className="checkout-result-icon is-expired">!</span><p className="eyebrow">THANH TOÁN TẠM DỪNG</p><h1>Hóa đơn chưa thể tiếp tục.</h1><p>Cấu hình thụ hưởng chưa sẵn sàng. Không chuyển tiền bằng mã này; hãy quay lại sau khi hệ thống mở thanh toán.</p><Link className="button button-primary" href="/plans">Trở lại chọn gói</Link></section><Footer /></main>;

  const qrUrl = vietQrImageUrl(invoice.amountVnd, invoice.transferContent);
  return <main className="checkout-page"><SiteHeader /><section className="checkout-shell page-shell">
    <div className="checkout-heading"><div><p className="eyebrow">CINEWAVE SECURE CHECKOUT</p><h1>Quét mã để hoàn tất.</h1><p>Hóa đơn được giữ trong 30 phút và tự cập nhật khi nhận xác nhận từ SePay.</p></div><span className="status-badge status-pending">Đang chờ thanh toán</span></div>
    <div className="checkout-grid">
      <article className="invoice-card">
        <div className="invoice-brand"><span>C</span><div><strong>CineWave</strong><small>HÓA ĐƠN GÓI THÀNH VIÊN</small></div></div>
        <dl><div><dt>Mã hóa đơn</dt><dd>{invoice.transferContent}</dd></div><div><dt>Khách hàng</dt><dd>{user.email}</dd></div><div><dt>Gói đăng ký</dt><dd>{plan.name} · {plan.quality}</dd></div><div><dt>Chu kỳ</dt><dd>01 tháng</dd></div></dl>
        <div className="invoice-total"><span>Tổng thanh toán</span><strong>{formatVnd(invoice.amountVnd)}</strong></div>
        <div className="invoice-bank"><span>Người thụ hưởng</span><strong>{merchant.accountName}</strong><small>{merchant.bankCode} · {merchant.accountNumber}</small></div>
        <p className="invoice-note">Vui lòng giữ nguyên số tiền và nội dung chuyển khoản. Sai thông tin sẽ cần đối soát thủ công.</p>
      </article>
      <article className="payment-qr-card">
        <div className="payment-qr-heading"><div><p className="eyebrow">VIETQR · NAPAS 247</p><h2>Quét bằng ứng dụng ngân hàng</h2></div><span>SEPAY FLOW</span></div>
        <div className="payment-qr-image"><img src={qrUrl} alt={`Mã VietQR thanh toán ${invoice.transferContent}`} width="540" height="640" /></div>
        <div className="payment-transfer-code"><span>Nội dung chuyển khoản</span><strong>{invoice.transferContent}</strong></div>
        <PaymentInvoiceClient invoiceId={invoice.id} transferContent={invoice.transferContent} expiresAt={invoice.expiresAt} />
      </article>
    </div>
    <div className="checkout-steps"><article><span>01</span><div><strong>Mở ứng dụng ngân hàng</strong><p>Chọn quét QR và kiểm tra người nhận.</p></div></article><article><span>02</span><div><strong>Giữ nguyên thông tin</strong><p>Không sửa số tiền hoặc mã CW.</p></div></article><article><span>03</span><div><strong>Chờ đối soát</strong><p>Trang tự cập nhật khi SePay gửi webhook.</p></div></article></div>
  </section><Footer /></main>;
}

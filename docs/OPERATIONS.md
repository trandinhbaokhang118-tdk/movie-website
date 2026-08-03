# CineWave operations runbook

## Release gates

Chỉ phát hành khi các lệnh sau đều thành công:

```bash
npm ci
npm run lint
npm run catalog:test
node --test tests/rendered-html.test.mjs
npm run test:e2e
npm run build
npm audit --omit=dev
```

Artifact `dist/` phải chứa `.openai/hosting.json` và toàn bộ migration trong `dist/.openai/drizzle/`.

## Runtime configuration

Production phải đặt `CINEWAVE_LOCAL_AUTH=0`. Không dùng Turnstile test key. `ADMIN_EMAILS` chỉ chứa bootstrap owners và phải được rà soát định kỳ. Thanh toán chỉ sẵn sàng khi có đủ `PAYMENT_BANK_CODE`, `PAYMENT_BANK_ACCOUNT`, `PAYMENT_ACCOUNT_NAME`, `SEPAY_WEBHOOK_API_KEY`; thiếu một biến thì UI tự tắt thanh toán.

R2 binding là `MEDIA`, D1 binding là `DB`. `TMDB_*` và Supabase là tùy chọn; thiếu chúng không làm hỏng catalog nguồn mở nội bộ.

## Health and monitoring

- Poll `GET /api/health` mỗi 60 giây từ ít nhất hai vùng. Alert sau 3 lần `503` liên tiếp.
- JSON health công khai chỉ trả capability `ready/disabled`, không trả secret hoặc tên tài khoản.
- Worker gắn `x-request-id` từ Cloudflare Ray ID; dùng ID này để liên kết log ứng dụng và request.
- Theo dõi 5xx, độ trễ p95, webhook 401/422, catalog sync failed, rate-limit tăng bất thường và lỗi playback theo `movieId`.
- `/admin/system` và `/admin/security` chỉ hiển thị số đo truy vấn thật; không suy diễn uptime hoặc backup thành công.

## Backup and restore

1. Bật Cloudflare D1 Time Travel/backup theo gói tài khoản và kiểm tra retention trong dashboard.
2. Trước migration quan trọng, export D1 bằng công cụ Cloudflare chính thức và lưu vào kho mã hóa, tách khỏi tài khoản production.
3. R2 bật versioning/lifecycle phù hợp với quyền nội dung. Giữ manifest danh sách object và metadata từ bảng `media_assets`.
4. Mỗi quý diễn tập restore vào project staging: khôi phục D1, gắn bucket bản sao, chạy `/api/health`, đăng nhập, phát một MP4/HLS, đối chiếu audit và hóa đơn.
5. Không restore trực tiếp đè production khi chưa có snapshot mới nhất và phê duyệt của hai người vận hành.

## Incident response

- Rò secret: rotate secret tại nhà cung cấp, thu hồi toàn bộ `auth_sessions` nếu liên quan auth, kiểm tra audit, sau đó deploy version mới.
- Webhook giả/lệch tiền: tạm bỏ `SEPAY_WEBHOOK_API_KEY` để payment chuyển `disabled`, lưu payload/transaction ID phục vụ đối soát, không kích hoạt thủ công nếu chưa xác minh ngân hàng.
- Media vi phạm quyền: chuyển title sang `hidden`, giữ audit/bằng chứng giấy phép, sau đó xóa object R2 theo quy trình pháp lý.
- D1 lỗi: đưa site vào chế độ đọc công khai nếu có thể, không nhận thanh toán, restore staging trước rồi mới chuyển traffic.
- Tài khoản admin bị chiếm: khóa user, thu hồi session, rotate bootstrap admin list và Turnstile/payment secrets có liên quan.

## Rollback

Giữ version triển khai trước đó. Rollback code trước; migration D1 chỉ rollback khi migration đảo chiều đã được kiểm thử trên bản sao. Các cột/tables bổ sung hiện được thiết kế additive để version trước không mất dữ liệu.

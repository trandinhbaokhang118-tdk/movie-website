# CineWave security model

## Controls implemented

- PBKDF2-SHA-256 210.000 vòng với salt riêng; database không lưu mật khẩu thô.
- Session token 256-bit chỉ nằm trong cookie `HttpOnly`, `SameSite=Lax`, `Secure` ngoài loopback; D1 chỉ lưu SHA-256 của token.
- Turnstile xác minh server-side theo action/hostname; local/E2E bypass bị khóa bằng binding riêng.
- Fixed-window rate-limit D1 cho login/register; khóa tài khoản thu hồi tất cả session.
- API mutation kiểm tra same-origin/`Sec-Fetch-Site`, giới hạn JSON body và xác thực user ở server.
- RBAC server-side: Super Admin, Content Manager, Support, Analyst. Thay đổi role, nội dung và trạng thái user được audit.
- SePay webhook dùng API key so sánh constant-time, kiểm tra beneficiary, loại giao dịch, số tiền, mã hóa đơn, hạn và idempotency transaction ID.
- CSP, HSTS trên HTTPS, anti-sniffing, referrer/permissions policy, form/frame restrictions và request ID tại Worker.
- R2 là private binding; media được validate MIME/kích thước, cấp UUID key và phục vụ qua route same-origin có Range/ETag.
- Người dùng tự xuất dữ liệu, thu hồi thiết bị, đổi mật khẩu và anonymize tài khoản. Chứng từ thanh toán được giữ bằng internal ID cho nghĩa vụ đối soát.

## Trust boundaries

TMDB chỉ cung cấp metadata/trailer, không chứng minh quyền phát. Video chỉ được xuất bản khi CMS có media và URL giấy phép. Internet Archive/Creative Commons records vẫn cần người vận hành kiểm tra bằng chứng trước release.

Admin form nhận URL ngoài; CSP giới hạn trình duyệt nhưng người duyệt nội dung phải xác minh domain, CORS, quyền sử dụng và tính ổn định. R2 upload hiện không thay thế antivirus/FFmpeg sandbox chuyên dụng.

## Known gaps before higher-risk commercial use

- Chưa có email verification/reset provider và MFA/WebAuthn cho admin.
- Chưa có DRM, forensic watermark, offline license hoặc signed per-segment HLS authorization.
- Chưa có malware scanning/encoding worker độc lập; upload trực tiếp giới hạn 95 MB.
- Chưa có external SIEM, pager, WAF rule tuning, pentest và load test độc lập.

Không bật nội dung thương mại nhạy cảm hoặc thanh toán diện rộng cho tới khi các gap phù hợp với threat model được xử lý.

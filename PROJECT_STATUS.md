# Trạng thái release CineWave

Cập nhật: 03/08/2026

## Kết luận

CineWave hiện là release candidate production cho một dịch vụ web streaming nguồn mở/được cấp phép ở quy mô nhỏ. Toàn bộ luồng cốt lõi đã có UI, xử lý server và dữ liệu bền vững; các dashboard không còn dùng uptime, lượt xem, backup hoặc cảnh báo giả.

Đây không phải hạ tầng tương đương Netflix/Disney+: DRM đa nền tảng, transcoding farm, email provider, MFA/WebAuthn, SIEM/pager, app TV/mobile và multi-region DR vẫn cần dịch vụ cùng ngân sách vận hành riêng.

## Hoàn thành trong release

- Landing, browse/search/trending, title detail, responsive và khả năng truy cập.
- Catalog phim nguồn mở có nguồn, giấy phép, attribution, checksum và local MP4 fallback.
- Player MP4/WebM và HLS.js adaptive playback, HTTP Range từ R2, WebVTT, resume, progress, tốc độ, PiP và fullscreen.
- Tài khoản password PBKDF2, Turnstile, D1 rate-limit, cookie production, session theo thiết bị và thu hồi session.
- Nhiều profile, kids/maturity, locale, subtitle preference, autoplay, watchlist, reaction, history và recommendations.
- Đổi mật khẩu, xuất JSON dữ liệu và anonymize tài khoản.
- Gói thành viên, giới hạn concurrent streams, VietQR và SePay webhook idempotent; payment fail-closed khi thiếu runtime config.
- CMS title/editorial/blog/program/podcast, lịch xuất bản, R2 upload poster/video/subtitle và rights metadata.
- RBAC server-side Super Admin/Content Manager/Support/Analyst, account lock, role assignment và audit log.
- Admin metrics/security/system lấy trực tiếp từ D1/runtime capability, không hiển thị số liệu minh họa.
- PWA manifest/service worker với offline fallback; robots, sitemap và dynamic absolute metadata.
- CSP/HSTS/security headers, same-origin mutation guard, JSON/upload size validation, request ID và health endpoint.
- Migration D1 đến `0010_eminent_vapor`, D1 runtime schema v11, R2 binding `MEDIA`.
- CI workflow, operations/security runbooks và quy trình backup/restore/incident response.

## Kết quả xác minh

- `npm run lint`: đạt, không warning.
- `npm run catalog:test`: 5/5 đạt.
- `node --test tests/rendered-html.test.mjs`: 23/23 đạt.
- `npm run test:e2e`: 10/10 đạt trên Chromium với D1 E2E tách biệt.
- `npm run build`: đạt trên Vinext/Vite Cloudflare target.
- `npm audit --omit=dev`: 0 production advisory.

## Cần cấu hình ở môi trường production

- Turnstile production keys + allowed hostname; `CINEWAVE_LOCAL_AUTH=0`.
- Bootstrap `ADMIN_EMAILS` tối thiểu và rà soát RBAC sau lần đăng nhập đầu.
- VietQR beneficiary + SePay webhook secret nếu mở thanh toán.
- TMDB/Supabase chỉ khi dùng catalog import tương ứng.
- Cloudflare D1 backup/time-travel, R2 lifecycle/versioning, external health monitor và alert destination.

## Giới hạn không được tuyên bố là đã hoàn thành

- Email verification/reset, MFA/WebAuthn và maker-checker cho thao tác tài chính.
- DRM Widevine/FairPlay/PlayReady, offline license và forensic watermark.
- FFmpeg transcoding pipeline nhiều rendition, virus scanning và signed HLS segments.
- CRUD season/episode chuyên sâu, nhiều audio track và studio subtitle workflow.
- Refund/support ticket automation, tax invoice provider và revenue accounting.
- Security/load/pentest độc lập, multi-region failover và disaster recovery đã chứng nhận.

Các giới hạn này không chặn việc phát hành catalog nguồn mở quy mô nhỏ khi runtime config và checklist trong `docs/OPERATIONS.md` đã hoàn tất; chúng là gate bắt buộc trước khi mở nội dung thương mại rủi ro cao hoặc lượng người dùng lớn.

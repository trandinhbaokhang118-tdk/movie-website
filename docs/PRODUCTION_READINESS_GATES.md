# Production readiness gates

CineWave trong snapshot này là MVP có nền tảng triển khai, chưa phải hệ thống production-ready. Không được đổi kết luận này chỉ dựa trên build hoặc E2E xanh.

## Trạng thái theo nhóm

| Nhóm | Đã có bằng chứng trong snapshot | Chưa hoàn tất / gate bắt buộc |
| --- | --- | --- |
| Recommendation | Hybrid TF-IDF + reaction/completion/recency, `movie_id`, dedupe, `model_version`, reason code, diversity, exploration guardrail, offline regression set, kill switch/shadow/canary | Ground truth thực, embedding job, online experiment có KPI, impression writer production, canary dashboard và phê duyệt model |
| Supabase | Migration tuần tự, RLS, seed, pgvector foundation, pgTAP theo viewer/admin/anon và CI reset migration | CI run xanh trên commit bàn giao, staging restore drill có log, retention/backup policy thực tế |
| Media | MP4/WebM, HLS.js, WebVTT, HTTP Range/R2 | FFmpeg ingest/transcode nhiều rendition, DASH, multi-audio, signed segment, Widevine/FairPlay/PlayReady, key/license service và load test CDN |
| Security | PBKDF2, session hash, same-origin mutation, Turnstile, rate limit, RBAC server-side và audit | MFA bắt buộc cho admin, recovery flow, maker-checker cho thao tác nhạy cảm, cảnh báo đăng nhập bất thường và pentest độc lập |
| Delivery/MLOps | Lint, contract, crawler, hybrid offline test, build, E2E và Supabase pgTAP trong CI | Artifact promotion, signed provenance/SBOM, staging canary, rollback drill và release approval tách biệt |
| Observability | Request ID, health endpoint, dữ liệu dashboard lấy từ runtime | Metrics/logs/traces tập trung, SLO đo được, alert destination, paging drill và capacity/load test |
| Client | Web responsive/PWA | Chỉ mở mobile/TV native sau khi media pipeline và web SLO ổn định |

## Tiêu chí cho phép tuyên bố production-ready

Tất cả điều kiện sau phải có bằng chứng gắn với một release cụ thể:

1. CI xanh cho mã nguồn, migration reset, RLS theo role, security scan và E2E.
2. Backup và restore staging thành công, có thời gian RPO/RTO đo được.
3. Admin MFA được cưỡng chế; RBAC và audit đã kiểm thử cho từng thao tác nhạy cảm.
4. Nếu phát nội dung thương mại: ABR packaging, DRM/license service, signed delivery và quyền nội dung đã qua nghiệm thu.
5. Recommendation có ground truth thực, model card được duyệt, shadow/canary đạt KPI và kill switch đã diễn tập.
6. Metrics, logs và traces đi tới hệ thống tập trung; SLO và cảnh báo đã phát thử tới người trực.
7. Load/security test đạt ngưỡng đã phê duyệt; không còn lỗi mức critical/high chưa được chấp nhận rủi ro.

## Trình tự ưu tiên

- P0: migration/RLS/restore evidence, CI ổn định, admin MFA, release claim trung thực.
- P1: media ingest + HLS/DASH ABR + DRM cho nội dung thương mại; observability/SLO; security/load test.
- P2: online recommendation experiment và embedding benchmark; sau đó mới cân nhắc ANN.
- P3: mobile/TV native khi web và media pipeline đạt SLO liên tục.

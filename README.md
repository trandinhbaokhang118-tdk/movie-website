# CineWave

CineWave là MVP nền tảng xem phim với catalog có nguồn gốc rõ ràng, tài khoản người dùng, hồ sơ xem riêng, watchlist, lịch sử xem, gói thành viên và khu vực quản trị. Dự án chạy theo mô hình Next.js-compatible trên Cloudflare Worker thông qua Vinext.

## Bàn giao nhanh

### Yêu cầu môi trường

- Node.js `>= 22.13`
- npm
- Python 3 (chỉ cần khi crawl catalog hoặc chạy test crawler)
- Tài khoản Supabase nếu dùng catalog/đồng bộ Supabase
- Tài khoản Cloudflare nếu triển khai Worker hoặc dùng Turnstile thực tế

### Chạy local

```bash
git clone <repository-url>
cd cinewave
npm install
Copy-Item .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Dữ liệu D1 local được tạo trong `.wrangler/` khi ứng dụng nhận request đầu tiên.

> Trên macOS/Linux, thay dòng `Copy-Item` bằng `cp .env.example .env.local`.

## Cấu hình môi trường

Điền các biến cần thiết vào `.env.local`. Không commit file này hoặc bất kỳ secret nào.

| Biến | Mục đích | Bắt buộc khi |
| --- | --- | --- |
| `TMDB_ACCESS_TOKEN` hoặc `TMDB_API_KEY` | Nhập metadata/trailer từ TMDB | Dùng import TMDB |
| `SUPABASE_URL` | URL Supabase project | Dùng Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Public/publishable key Supabase | Dùng Supabase |
| `ADMIN_EMAILS` | Danh sách email admin, ngăn cách bởi dấu phẩy | Cấp quyền `/admin` |
| `TURNSTILE_SITE_KEY` | Site key Cloudflare Turnstile | Bật Turnstile thực tế |
| `TURNSTILE_SECRET_KEY` | Secret key Cloudflare Turnstile | Bật Turnstile thực tế |
| `TURNSTILE_ALLOWED_HOSTNAMES` | Host được phép xác thực Turnstile | Production |
| `CINEWAVE_LOCAL_AUTH` | Cho phép xác thực local (`1`) | Chỉ local; production luôn `0` |
| `PAYMENT_BANK_CODE` | Mã ngân hàng nhận tiền VietQR | Bật thanh toán |
| `PAYMENT_BANK_ACCOUNT` | Số tài khoản nhận tiền | Bật thanh toán |
| `PAYMENT_ACCOUNT_NAME` | Tên chủ tài khoản | Bật thanh toán |
| `SEPAY_WEBHOOK_API_KEY` | Khóa xác thực webhook SePay | Bật thanh toán |

## Các lệnh quan trọng

| Lệnh | Công dụng |
| --- | --- |
| `npm run dev` | Chạy môi trường phát triển |
| `npm run build` | Build production Worker-compatible |
| `npm run start` | Chạy bản build |
| `npm run lint` | Kiểm tra ESLint |
| `npm test` | Build và chạy test HTML render |
| `npm run test:e2e` | Chạy Playwright E2E trên cổng 3100 với DB riêng |
| `npm run db:generate` | Tạo Drizzle migration sau khi sửa schema |
| `npm run db:status` | Xem các bảng D1 local |
| `npm run catalog:crawl` | Crawl catalog hợp lệ từ Internet Archive |
| `npm run catalog:test` | Kiểm tra crawler Python |

## Chức năng chính

- `/`: Trang chủ theo trạng thái đăng nhập; trang giới thiệu khi chưa đăng nhập.
- `/browse`, `/search`, `/title/[id]`: Khám phá, tìm kiếm và xem thông tin phim.
- `/watch/[id]`: Player video, kiểm tra quyền xem trước khi phát.
- `/login`, `/register`, `/profiles`, `/account`: Xác thực, hồ sơ và tài khoản.
- `/my-list`, `/history`: Watchlist và lịch sử xem theo từng profile.
- `/night`: Gợi ý phim theo cảm xúc và thời lượng còn lại.
- `/plans`, `/checkout/[id]`: Tạo hóa đơn VietQR và theo dõi thanh toán.
- `/admin`: Khu vực quản trị, chỉ cho email thuộc `ADMIN_EMAILS`.
- `/api/health`: Health/readiness endpoint.

## Kiến trúc và vị trí cần biết

| Khu vực | Vai trò |
| --- | --- |
| `app/` | Routes, UI, server actions và API routes |
| `app/components/` | Các thành phần giao diện tái sử dụng |
| `app/globals.css` | Toàn bộ style hệ thống và responsive layout |
| `data/licensed_catalog.json` | Catalog phim đã kiểm tra nguồn/phát hành |
| `lib/catalog.ts` | Kiểu dữ liệu và truy vấn catalog nội bộ |
| `db/schema.ts` | Schema D1/Drizzle |
| `db/runtime.ts` | Truy cập database ở runtime |
| `drizzle/` | Migration D1 |
| `supabase/` | Schema, migration và seed Supabase |
| `public/media/` | Artwork và video demo local |
| `tools/crawl_movies.py` | Crawler Internet Archive/TMDB |
| `worker/index.ts` | Entrypoint Cloudflare Worker |
| `tests/`, `e2e/` | Unit/render test và E2E test |

### Dữ liệu và xác thực

- D1 local lưu tài khoản, session, profile, watchlist, progress, reaction và audit.
- Supabase PostgreSQL dùng cho catalog chuẩn hóa và có RLS. Không đưa service-role key lên client.
- Mật khẩu được băm PBKDF2-SHA-256; session dùng cookie `HttpOnly` và database chỉ lưu hash của session token.
- Quyền admin luôn được kiểm tra phía server qua `ADMIN_EMAILS`; đăng nhập không tự cấp quyền admin.

## Làm việc với database

Sau khi thay đổi `db/schema.ts`:

```bash
npm run db:generate
npm run db:status
```

Không xóa `.wrangler/state` nếu cần giữ dữ liệu demo local. Với E2E, runner dùng database riêng và tự reset nên không làm thay đổi dữ liệu local.

## Catalog và media

Catalog phát phim chỉ dùng nội dung Creative Commons hoặc Public Domain có thông tin nguồn và giấy phép. `npm run catalog:crawl` lấy metadata từ Internet Archive và ghi vào `data/licensed_catalog.json`.

TMDB chỉ phục vụ metadata/trailer; TMDB không cấp quyền phát phim đầy đủ. Có thể nhập dữ liệu TMDB bằng:

```bash
python tools/crawl_movies.py tmdb --token "$TMDB_ACCESS_TOKEN"
```

Video demo `Sprite Fright` có bản local tại `public/media/sprite-fright-2021.mp4`; player ưu tiên file local và dùng Internet Archive làm nguồn dự phòng.

## Thanh toán VietQR và SePay

1. Cấu hình các biến `PAYMENT_*` và `SEPAY_WEBHOOK_API_KEY`.
2. Trên SePay, khai báo webhook HTTPS công khai tới `/api/webhooks/sepay`.
3. Chọn xác thực API key và dùng tiền tố mã thanh toán `CW`.
4. Chỉ kích hoạt gói khi tài khoản nhận tiền, mã hóa đơn và số tiền khớp.

Localhost có thể tạo mã QR nhưng không nhận webhook từ SePay nếu chưa có tunnel hoặc URL public. Trước khi triển khai thật, cần xác minh thông tin tài khoản thụ hưởng, bật HTTPS, bảo vệ secrets, theo dõi các giao dịch không khớp và chuẩn bị quy trình đối soát/hoàn tiền.

## Checklist trước khi bàn giao hoặc triển khai

- [ ] Đã chạy `npm run lint`.
- [ ] Đã chạy `npm test` và `npm run test:e2e`.
- [ ] `.env.local` không được commit và các secret production đã được cập nhật.
- [ ] `ADMIN_EMAILS` chỉ chứa người được cấp quyền.
- [ ] Turnstile dùng key production và `CINEWAVE_LOCAL_AUTH=0`.
- [ ] SePay webhook dùng HTTPS, secret riêng và được kiểm thử idempotency.
- [ ] Catalog có bằng chứng nguồn/giấy phép; không đưa phim thương mại chưa có quyền phát hành vào player.
- [ ] Kiểm tra `/api/health` sau deploy.

## Lưu ý bản quyền

Không dùng dữ liệu TMDB hay trailer để suy ra quyền phát phim. Với bất kỳ phim mới nào, cần lưu nguồn, giấy phép, phạm vi sử dụng, bằng chứng kiểm tra và thông tin credit trước khi phát trên hệ thống.

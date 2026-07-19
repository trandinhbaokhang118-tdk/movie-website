# CineWave

CineWave là production MVP cho một nền tảng xem phim tuyển chọn: catalog responsive, tìm kiếm, trang chi tiết, player video, hồ sơ người xem, watchlist, lưu tiến độ, tài khoản và control room vận hành.

## Product surfaces

- `/` storefront và các rail nội dung.
- `/browse`, `/search`, `/title/[id]` cho khám phá.
- `/watch/[id]` cho player video demo hợp pháp.
- `/my-list`, `/profiles`, `/account` dùng Sign in with ChatGPT và D1.
- `/admin` là control room có xác thực.
- `/history` là lịch sử xem có thể xóa theo mục hoặc toàn bộ.
- `/night` là Night Compass: khám phá nội dung theo cảm xúc và thời lượng còn lại trong đêm.
- `/plans` mô phỏng vòng đời gói thành viên trong sandbox, không thu tiền thật.
- `/api/watchlist`, `/api/progress` là API có kiểm tra danh tính phía server.
- `/api/health` cung cấp readiness tối thiểu cho nền tảng triển khai.

## Architecture

- Vinext/Next.js + React + TypeScript.
- Cloudflare Worker-compatible build.
- D1 + Drizzle migrations cho user, profile, watchlist, progress và audit.
- Dispatch-owned Sign in with ChatGPT; không lưu token ở trình duyệt.
- Design system “Midnight Cinema”, responsive và reduced-motion aware.
- “Midnight Mystique” dùng tím đêm/cyan làm nhận diện riêng, không sao chép thương hiệu Netflix.
- Dữ liệu watchlist/progress/reaction được cô lập theo profile đang hoạt động.
- Playback được cấp session phía server sau khi kiểm tra profile, độ tuổi, gói, giới hạn stream và bằng chứng quyền phát.
- Admin yêu cầu RBAC/allowlist phía server qua `ADMIN_EMAILS`; đăng nhập không mặc nhiên có quyền quản trị.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

`npm run db:generate` tạo migration sau khi thay đổi `db/schema.ts`.

## Production boundaries

- Billing hiện là sandbox có chủ đích. Trước khi thu tiền thật phải kết nối hosted checkout, webhook ký, state machine và reconciliation của provider đã chọn.
- Player chỉ phát asset Creative Commons/Public Domain có bằng chứng nguồn. HLS/DASH, DRM, signed CDN và media pipeline cần nhà cung cấp/media infrastructure thực tế.
- TMDB chỉ cung cấp metadata/trailer, không cấp quyền phát phim đầy đủ.

## Licensed catalog crawler

`npm run catalog:crawl` lấy metadata và đường dẫn phát của các phim Creative Commons/Public Domain đã tuyển chọn từ Internet Archive, ghi vào `data/licensed_catalog.json`. Lệnh này không tải phim thương mại và không vượt qua paywall. Với TMDB, dùng `python tools/crawl_movies.py tmdb --token "$TMDB_ACCESS_TOKEN"` để lấy metadata/trailer chính thức; dữ liệu này không cấp quyền phát phim đầy đủ.

## Demo media

Player sử dụng Big Buck Bunny của Blender Foundation làm video minh họa hợp pháp. Catalog và tên phim là dữ liệu hư cấu của CineWave; hình nền dùng ảnh Unsplash qua URL tối ưu hóa.

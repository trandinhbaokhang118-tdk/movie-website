# CineWave

CineWave là production MVP cho một nền tảng xem phim tuyển chọn: catalog responsive, tìm kiếm, trang chi tiết, player video, hồ sơ người xem, watchlist, lưu tiến độ, tài khoản và control room vận hành.

## Product surfaces

- `/` storefront và các rail nội dung.
- `/browse`, `/search`, `/title/[id]` cho khám phá.
- `/watch/[id]` cho player video demo hợp pháp.
- `/my-list`, `/profiles`, `/account` dùng Sign in with ChatGPT và D1.
- `/admin` là control room có xác thực.
- `/api/watchlist`, `/api/progress` là API có kiểm tra danh tính phía server.

## Architecture

- Vinext/Next.js + React + TypeScript.
- Cloudflare Worker-compatible build.
- D1 + Drizzle migrations cho user, profile, watchlist, progress và audit.
- Dispatch-owned Sign in with ChatGPT; không lưu token ở trình duyệt.
- Design system “Midnight Cinema”, responsive và reduced-motion aware.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

`npm run db:generate` tạo migration sau khi thay đổi `db/schema.ts`.

## Demo media

Player sử dụng Big Buck Bunny của Blender Foundation làm video minh họa hợp pháp. Catalog và tên phim là dữ liệu hư cấu của CineWave; hình nền dùng ảnh Unsplash qua URL tối ưu hóa.

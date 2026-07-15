import Link from "next/link";
import {
  chatGPTSignInPath,
  chatGPTSignOutPath,
  getChatGPTUser,
} from "../chatgpt-auth";
import { Brand } from "./Brand";

export async function SiteHeader() {
  const user = await getChatGPTUser();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Điều hướng chính">
          <Link href="/">Trang chủ</Link>
          <Link href="/browse">Phim</Link>
          <Link href="/browse?type=series">Series</Link>
          <Link href="/my-list">Danh sách của tôi</Link>
        </nav>
        <div className="header-actions">
          <Link className="icon-link" href="/search" aria-label="Tìm kiếm">
            <span aria-hidden="true">⌕</span>
          </Link>
          {user ? (
            <div className="profile-menu">
              <Link className="avatar" href="/account" aria-label="Tài khoản">
                {user.displayName.slice(0, 1).toUpperCase()}
              </Link>
              <Link className="header-signout" href={chatGPTSignOutPath("/")}>
                Đăng xuất
              </Link>
            </div>
          ) : (
            <Link className="button button-small" href={chatGPTSignInPath("/")}>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

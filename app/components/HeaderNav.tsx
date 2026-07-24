"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const navItems = [
  { href: "/", label: "Trang chủ" },
  { href: "/browse", label: "Phim", type: "movie" },
  { href: "/browse?type=series", label: "Series", type: "series" },
  { href: "/night", label: "Đêm nay" },
  { href: "/my-list", label: "Tủ phim" },
  { href: "/history", label: "Lịch sử" },
] as const;

export function HeaderNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const browseType = searchParams.get("type");

  return (
    <nav className="main-nav" aria-label="Điều hướng chính">
      {navItems.map((item) => {
        const itemPath = item.href.split("?")[0];
        const isBrowseItem = itemPath === "/browse";
        const isActive = isBrowseItem
          ? pathname === "/browse" && (item.type === "series" ? browseType === "series" : browseType !== "series")
          : itemPath === "/"
            ? pathname === "/"
            : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

        return (
          <Link key={item.href} href={item.href} className={isActive ? "is-active" : undefined} aria-current={isActive ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

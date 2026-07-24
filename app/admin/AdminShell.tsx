"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, CalendarDays, Clapperboard, DatabaseBackup, FileAudio, LayoutDashboard, LockKeyhole, Settings2, ShieldCheck, UsersRound } from "lucide-react";

const groups = [
  { label: "ĐIỀU HÀNH", items: [["Tổng quan", "/admin", LayoutDashboard], ["Quan sát & phân tích", "/admin/analytics", Activity], ["Giám sát hệ thống", "/admin/system", ShieldCheck]] },
  { label: "NỘI DUNG", items: [["Phim & Series", "/admin/content", Clapperboard], ["Lịch công chiếu", "/admin/schedule", CalendarDays], ["Podcast", "/admin/podcast", FileAudio], ["Blog", "/admin/blog", BookOpen]] },
  { label: "HỆ THỐNG", items: [["Người dùng", "/admin/accounts", UsersRound], ["Phân quyền", "/admin/permissions", LockKeyhole], ["Sao lưu & bảo mật", "/admin/security", DatabaseBackup], ["Cấu hình", "/admin/configuration", Settings2]] },
] as const;

export function AdminShell({ children, displayName }: { children: React.ReactNode; displayName: string }) {
  const pathname = usePathname();
  return <main className="admin-page admin-v2">
    <aside className="admin-v2-sidebar">
      <Link href="/" className="admin-brand"><span>C</span><strong>CINEWAVE</strong></Link>
      <div className="admin-workspace"><small>KHÔNG GIAN LÀM VIỆC</small><button><span>CW</span><b>CineWave Vietnam</b></button></div>
      <nav aria-label="Điều hướng quản trị">{groups.map(group => <div key={group.label}><p>{group.label}</p>{group.items.map(([label, href, Icon]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon size={17}/>{label}</Link>)}</div>)}</nav>
      <div className="admin-profile"><span>{displayName.slice(0,2).toUpperCase()}</span><div><b>{displayName}</b><small>Quản trị viên</small></div></div>
    </aside>
    <section className="admin-v2-main"><header className="admin-topbar"><strong>Trung tâm vận hành</strong><div><span/><small>Hệ thống ổn định</small></div></header>{children}</section>
  </main>;
}

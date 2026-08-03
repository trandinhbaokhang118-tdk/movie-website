"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookOpen, CalendarDays, Clapperboard, DatabaseBackup, FileAudio, LayoutDashboard, LockKeyhole, Settings2, ShieldCheck, UsersRound } from "lucide-react";

const groups = [
  { label: "ĐIỀU HÀNH", items: [["Tổng quan", "/admin", LayoutDashboard, "overview"], ["Quan sát & phân tích", "/admin/analytics", Activity, "analytics"], ["Giám sát hệ thống", "/admin/system", ShieldCheck, "system"]] },
  { label: "NỘI DUNG", items: [["Phim & Series", "/admin/content", Clapperboard, "content"], ["Lịch công chiếu", "/admin/schedule", CalendarDays, "content"], ["Podcast", "/admin/podcast", FileAudio, "content"], ["Blog", "/admin/blog", BookOpen, "content"]] },
  { label: "HỆ THỐNG", items: [["Người dùng", "/admin/accounts", UsersRound, "accounts"], ["Phân quyền", "/admin/permissions", LockKeyhole, "permissions"], ["Sao lưu & bảo mật", "/admin/security", DatabaseBackup, "system"], ["Cấu hình & nhật ký", "/admin/configuration", Settings2, "audit"]] },
] as const;

export function AdminShell({ children, displayName, role, capabilities }: { children: React.ReactNode; displayName: string; role: string; capabilities: string[] }) {
  const pathname = usePathname();
  return <main className="admin-page admin-v2">
    <aside className="admin-v2-sidebar">
      <Link href="/" className="admin-brand"><span>C</span><strong>CINEWAVE</strong></Link>
      <div className="admin-workspace"><small>KHÔNG GIAN LÀM VIỆC</small><button><span>CW</span><b>CineWave Vietnam</b></button></div>
      <nav aria-label="Điều hướng quản trị">{groups.map(group => { const items = group.items.filter(([, , , capability]) => capabilities.includes(capability)); return items.length ? <div key={group.label}><p>{group.label}</p>{items.map(([label, href, Icon]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}><Icon size={17}/>{label}</Link>)}</div> : null; })}</nav>
      <div className="admin-profile"><span>{displayName.slice(0,2).toUpperCase()}</span><div><b>{displayName}</b><small>{role.replaceAll("_", " ")}</small></div></div>
    </aside>
    <section className="admin-v2-main"><header className="admin-topbar"><strong>Trung tâm vận hành</strong><div><span/><small>Số liệu trực tiếp</small></div></header>{children}</section>
  </main>;
}

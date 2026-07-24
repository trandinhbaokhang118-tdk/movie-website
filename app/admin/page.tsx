import Link from "next/link";
import { Activity, Film, Gauge, UsersRound } from "lucide-react";
import { getImportedCatalogStats, listAdminAccounts, listManagedTitles } from "@/db/runtime";
import { AdminPageHead } from "./AdminPageHead";

export default async function AdminOverview() {
  const [imported, managed, accounts] = await Promise.all([getImportedCatalogStats(), listManagedTitles(), listAdminAccounts()]);
  return <div className="admin-dashboard"><AdminPageHead eyebrow="TRUNG TÂM ĐIỀU HÀNH" title="Tổng quan" description="Ảnh chụp nhanh toàn bộ hoạt động của CineWave."/>
    <div className="admin-kpis"><Kpi icon={<UsersRound/>} label="Người dùng" value={String(accounts.length)}/><Kpi icon={<Gauge/>} label="Lượt xem tháng" value="1,28M"/><Kpi icon={<Film/>} label="Tổng nội dung" value={String(managed.length + imported.movies)}/><Kpi icon={<Activity/>} label="Uptime" value="99,99%"/></div>
    <div className="admin-function-grid"><Link href="/admin/analytics"><b>Quan sát & phân tích</b><span>Theo dõi lượt xem, người dùng và thiết bị →</span></Link><Link href="/admin/system"><b>Giám sát hệ thống</b><span>CDN, API, cơ sở dữ liệu và cảnh báo →</span></Link><Link href="/admin/content"><b>Quản lý nội dung</b><span>Phim, series, metadata và phát hành →</span></Link><Link href="/admin/accounts"><b>Quản lý người dùng</b><span>Tài khoản, trạng thái và quyền truy cập →</span></Link></div>
  </div>;
}
function Kpi({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <article className="admin-kpi"><i className="purple">{icon}</i><div><p>{label}</p><strong>{value}</strong><span>Cập nhật vừa xong</span></div></article> }

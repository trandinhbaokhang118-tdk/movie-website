import Link from "next/link";
import { Activity, Film, Gauge, UsersRound } from "lucide-react";
import { adminRoleCan, getPlatformSnapshot } from "@/db/runtime";
import { AdminPageHead } from "./AdminPageHead";
import { requireAdminCapability } from "./access";

export default async function AdminOverview() {
  const { role } = await requireAdminCapability("overview");
  const snapshot = await getPlatformSnapshot();
  return <div className="admin-dashboard"><AdminPageHead eyebrow="TRUNG TÂM ĐIỀU HÀNH" title="Tổng quan" description="Ảnh chụp nhanh toàn bộ hoạt động của CineWave."/>
    <div className="admin-kpis"><Kpi icon={<UsersRound/>} label="Người dùng" value={String(snapshot.users)}/><Kpi icon={<Gauge/>} label="Lượt xem 30 ngày" value={String(snapshot.viewsLast30Days)}/><Kpi icon={<Film/>} label="Tổng nội dung" value={String(snapshot.totalContent)}/><Kpi icon={<Activity/>} label="Phiên đăng nhập" value={String(snapshot.activeSessions)}/></div>
    <div className="admin-function-grid">{adminRoleCan(role,"analytics")?<Link href="/admin/analytics"><b>Quan sát & phân tích</b><span>Theo dõi lượt xem, người dùng và thiết bị →</span></Link>:null}{adminRoleCan(role,"system")?<Link href="/admin/system"><b>Giám sát hệ thống</b><span>D1, media, thanh toán và bảo mật →</span></Link>:null}{adminRoleCan(role,"content")?<Link href="/admin/content"><b>Quản lý nội dung</b><span>Phim, series, metadata và phát hành →</span></Link>:null}{adminRoleCan(role,"accounts")?<Link href="/admin/accounts"><b>Quản lý người dùng</b><span>Tài khoản, trạng thái và quyền truy cập →</span></Link>:null}</div>
  </div>;
}
function Kpi({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <article className="admin-kpi"><i className="purple">{icon}</i><div><p>{label}</p><strong>{value}</strong><span>Dữ liệu trực tiếp từ D1</span></div></article> }

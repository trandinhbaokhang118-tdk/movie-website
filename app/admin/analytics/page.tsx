import { getAdminContentPerformance } from "@/db/runtime";
import { AdminPageHead } from "../AdminPageHead";
import { requireAdminCapability } from "../access";
import { LazyAnalytics } from "../LazyAnalytics";

export default async function AnalyticsPage() {
  await requireAdminCapability("analytics");
  const performance = await getAdminContentPerformance();
  return <div className="admin-dashboard">
    <AdminPageHead eyebrow="QUAN SÁT" title="Hiệu suất nội dung" description="Theo dõi riêng hiệu suất phim, blog, chương trình và podcast đã đăng."/>
    <LazyAnalytics performance={performance}/>
  </div>;
}

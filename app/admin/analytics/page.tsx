import { AdminPageHead } from "../AdminPageHead";
import { LazyAnalytics } from "../LazyAnalytics";
export default function AnalyticsPage() { return <div className="admin-dashboard"><AdminPageHead eyebrow="QUAN SÁT" title="Phân tích hoạt động" description="Biểu đồ chỉ được khởi tạo khi cuộn tới vùng hiển thị."/><LazyAnalytics/></div> }

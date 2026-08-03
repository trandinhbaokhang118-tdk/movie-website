import { listAuditEvents } from "@/db/runtime";
import { AdminPageHead } from "../AdminPageHead";
import { requireAdminCapability } from "../access";
export default async function Page(){await requireAdminCapability("audit");const events=await listAuditEvents(20);return <div className="admin-dashboard"><AdminPageHead eyebrow="PLATFORM" title="Cấu hình & nhật ký" description="Lịch sử thao tác vận hành được lưu bền vững trong D1."/><div className="audit-list-v2">{events.length?events.map(e=><article key={e.id}><span>✓</span><div><b>{e.action}</b><span>{e.actorEmail} · {e.target}</span></div><time>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"short",timeStyle:"short"}).format(new Date(e.createdAt))}</time></article>):<p>Chưa có sự kiện vận hành.</p>}</div></div>}

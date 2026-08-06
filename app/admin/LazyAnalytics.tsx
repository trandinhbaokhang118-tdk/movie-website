"use client";
import { useEffect, useRef, useState } from "react";

type Performance = {
  movies: { id: string; title: string; status: string; views: number }[];
  editorials: { kind: "blog" | "program" | "podcast"; total: number; published: number; views: number; engagements: number; completion: number }[];
};

type EditorialPerformance = Performance["editorials"][number];

export function LazyAnalytics({ performance }: { performance: Performance }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: "100px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const blog = performance.editorials.find(item => item.kind === "blog");
  const program = performance.editorials.find(item => item.kind === "program");
  const podcast = performance.editorials.find(item => item.kind === "podcast");
  const movieViews = performance.movies.reduce((sum, item) => sum + Number(item.views), 0);
  return <section ref={ref} className={`content-performance ${visible ? "is-visible" : ""}`} aria-busy={!visible}>
    {!visible ? <div className="admin-panel chart-skeleton"><span/><span/><span/></div> : <>
      <div className="performance-kpis">
        <Metric label="Lượt xem phim" value={movieViews.toLocaleString("vi-VN")} note={`${performance.movies.length} phim được theo dõi`}/>
        <Metric label="Bài blog đã đăng" value={String(blog?.published ?? 0)} note={`${blog?.total ?? 0} bài trong hệ thống`}/>
        <Metric label="Chương trình đã đăng" value={String(program?.published ?? 0)} note={`${program?.total ?? 0} chương trình trong lịch`}/>
        <Metric label="Podcast đã đăng" value={String(podcast?.published ?? 0)} note={`${podcast?.total ?? 0} tập trong hệ thống`}/>
      </div>
      <div className="performance-grid">
        <PerformanceChart title="Hiệu suất phim" subtitle="Lượt phát theo từng phim" rows={performance.movies.map(item => ({ label: item.title, value: Number(item.views), suffix: " lượt" }))}/>
        <StatusChart editorials={performance.editorials}/>
        <PerformanceChart title="Tương tác nội dung" subtitle="Lượt tương tác blog, chương trình và podcast" rows={[
          { label: "Blog", value: Number(blog?.engagements ?? 0), suffix: " tương tác" },
          { label: "Chương trình", value: Number(program?.engagements ?? 0), suffix: " tương tác" },
          { label: "Podcast", value: Number(podcast?.engagements ?? 0), suffix: " tương tác" },
        ]}/>
      </div>
    </>}
  </section>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="admin-panel performance-metric"><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

function PerformanceChart({ title, subtitle, rows }: { title: string; subtitle: string; rows: { label: string; value: number; suffix: string }[] }) {
  const data = rows.length ? rows : [{ label: "Chưa có dữ liệu", value: 0, suffix: "" }];
  const max = Math.max(1, ...data.map(row => row.value));
  return <article className="admin-panel bar-panel">
    <header className="panel-head"><div><h3>{title}</h3><p>{subtitle}</p></div></header>
    <div className="performance-bars">{data.slice(0, 5).map(row => <div key={row.label}>
      <span><b>{row.label}</b><small>{row.value.toLocaleString("vi-VN")}{row.suffix}</small></span>
      <i><em style={{ width: `${Math.max(row.value ? 8 : 2, row.value / max * 100)}%` }}/></i>
    </div>)}</div>
  </article>;
}

function StatusChart({ editorials }: { editorials: EditorialPerformance[] }) {
  const total = editorials.reduce((sum, item) => sum + Number(item.total), 0);
  const published = editorials.reduce((sum, item) => sum + Number(item.published), 0);
  const rate = total ? Math.round(published / total * 100) : 0;
  return <article className="admin-panel publish-panel">
    <header className="panel-head"><div><h3>Tiến độ xuất bản</h3><p>Tỷ lệ nội dung đã công khai</p></div></header>
    <div className="publish-ring" style={{ background: `conic-gradient(#7258e8 ${rate}%, #eceaf7 0)` }}><div><strong>{rate}%</strong><span>ĐÃ ĐĂNG</span></div></div>
    <div className="publish-legend">{(["blog", "program", "podcast"] as const).map(kind => {
      const item = editorials.find(editorial => editorial.kind === kind);
      const label = kind === "blog" ? "Blog" : kind === "program" ? "Chương trình" : "Podcast";
      return <span key={kind}><i/>{label} <b>{item?.published ?? 0}/{item?.total ?? 0}</b></span>;
    })}</div>
  </article>;
}

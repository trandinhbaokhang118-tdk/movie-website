"use client";
import { useEffect, useRef, useState } from "react";

export function LazyAnalytics() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: "100px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <section ref={ref} className={`admin-analytics-grid lazy-chart-zone ${visible ? "is-visible" : ""}`} aria-busy={!visible}>
    {!visible ? <div className="admin-panel chart-skeleton"><span/><span/><span/></div> : <>
      <article className="admin-panel traffic-panel"><header className="panel-head"><div><h3>Lượt xem & người dùng</h3><p>Xu hướng trong 21 ngày gần nhất</p></div></header><div className="chart-legend"><span><i className="violet"/>Lượt xem</span><span><i className="cyan"/>Người dùng</span></div><div className="line-chart"><div className="grid-lines"><span>60K</span><span>45K</span><span>30K</span><span>15K</span><span>0</span></div><div className="chart-line views"/><div className="chart-line users"/><div className="x-labels"><span>01/07</span><span>05/07</span><span>09/07</span><span>13/07</span><span>17/07</span><span>21/07</span></div></div></article>
      <article className="admin-panel audience-panel"><header className="panel-head"><div><h3>Thiết bị truy cập</h3><p>Phân bổ theo nền tảng</p></div></header><div className="donut"><div><strong>1,28M</strong><span>TỔNG LƯỢT XEM</span></div></div><div className="device-list"><div><span>Smart TV</span><b>42,8%</b></div><div><span>Điện thoại</span><b>31,2%</b></div><div><span>Máy tính</span><b>18,5%</b></div></div></article>
    </>}
  </section>;
}

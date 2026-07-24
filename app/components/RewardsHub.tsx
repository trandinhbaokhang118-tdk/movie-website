"use client";

import Link from "next/link";
import { Award, Check, CheckCircle2, ChevronRight, Clock3, Coins, Copy, Film, Gift, LockKeyhole, Share2, Sparkles, Star, TicketPercent, UserPlus, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type RewardState = { coins: number; streak: number; lastCheckIn: string; claimed: string[]; redeemed: string[] };
const initialState: RewardState = { coins: 120, streak: 2, lastCheckIn: "", claimed: [], redeemed: [] };
const storageKey = "cinewave-rewards-v1";
const coupons = [
  { id: "new", icon: Sparkles, label: "Dành cho người mới", title: "Giảm 50% tháng VIP đầu tiên", code: "WELCOME50", note: "Dành cho tài khoản chưa từng mua VIP", expiry: "Còn 7 ngày", color: "mint" },
  { id: "friend", icon: UserPlus, label: "Mời bạn bè", title: "Tặng 7 ngày VIP cho cả hai", code: "BANMOI7NGAY", note: "Khi bạn bè kích hoạt gói từ 1 tháng", expiry: "Không giới hạn", color: "violet" },
  { id: "weekend", icon: TicketPercent, label: "Cuối tuần", title: "Giảm 30.000đ gói Eclipse", code: "WEEKEND30", note: "Đơn từ 99.000đ, mỗi tài khoản 1 lần", expiry: "Đến 28/07", color: "gold" },
];
const missions = [
  { id: "profile", icon: Star, title: "Hoàn thiện hồ sơ", detail: "Thêm tên và ảnh đại diện", coins: 50, progress: 100 },
  { id: "watch", icon: Film, title: "Xem phim đầu tiên", detail: "Xem ít nhất 15 phút", coins: 80, progress: 100 },
  { id: "list", icon: Gift, title: "Thêm 3 phim vào danh sách", detail: "Đã thêm 2/3 phim", coins: 40, progress: 67 },
  { id: "invite", icon: UserPlus, title: "Mời một người bạn", detail: "Nhận xu khi bạn bè đăng ký", coins: 200, progress: 0 },
];
const gifts = [
  { id: "voucher20", title: "Voucher giảm 20.000đ", price: 300, tag: "Phổ biến", icon: TicketPercent },
  { id: "vip3", title: "3 ngày VIP Eclipse", price: 500, tag: "Đáng đổi", icon: Award },
  { id: "avatar", title: "Khung avatar Ánh Trăng", price: 650, tag: "Giới hạn", icon: Sparkles },
  { id: "vip7", title: "7 ngày VIP Constellation", price: 1200, tag: "Cao cấp", icon: Gift },
];
const todayKey = () => new Date().toISOString().slice(0, 10);

export function RewardsHub() {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<"missions" | "gifts">("missions");
  const checkedToday = state.lastCheckIn === todayKey();
  const nextMilestone = useMemo(() => Math.ceil((state.coins + 1) / 500) * 500, [state.coins]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try { const saved = localStorage.getItem(storageKey); if (saved) setState(JSON.parse(saved)); } catch {}
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(storageKey, JSON.stringify(state)); }, [ready, state]);
  useEffect(() => { if (!toast) return; const id = window.setTimeout(() => setToast(""), 2600); return () => window.clearTimeout(id); }, [toast]);

  const jumpToActivity = () => document.getElementById("reward-missions")?.scrollIntoView({ behavior: "smooth" });
  function checkIn() { if (checkedToday) return; const reward = state.streak >= 6 ? 100 : 20 + state.streak * 10; setState((old) => ({ ...old, coins: old.coins + reward, streak: Math.min(old.streak + 1, 7), lastCheckIn: todayKey() })); setToast(`Điểm danh thành công · +${reward} CineXu`); }
  function claimMission(id: string, coins: number) { if (state.claimed.includes(id)) return; setState((old) => ({ ...old, coins: old.coins + coins, claimed: [...old.claimed, id] })); setToast(`Đã nhận ${coins} CineXu`); }
  function redeem(id: string, title: string, price: number) { if (state.redeemed.includes(id)) return setToast("Bạn đã đổi phần quà này rồi"); if (state.coins < price) return setToast(`Bạn cần thêm ${price - state.coins} CineXu`); setState((old) => ({ ...old, coins: old.coins - price, redeemed: [...old.redeemed, id] })); setToast(`Đổi thành công: ${title}`); }
  async function copy(value: string, message = "Đã sao chép mã ưu đãi") { await navigator.clipboard.writeText(value).catch(() => undefined); setToast(message); }
  async function invite() { const url = `${window.location.origin}/register?ref=CINEFRIEND`; if (navigator.share) await navigator.share({ title: "Xem phim cùng mình trên CineWave", text: "Đăng ký để cả hai cùng nhận 7 ngày VIP!", url }).catch(() => undefined); else await copy(url, "Đã sao chép liên kết mời bạn"); }

  return <section className="rewards-page page-shell">
    {toast ? <div className="reward-toast" role="status"><CheckCircle2 size={18} />{toast}</div> : null}
    <div className="rewards-hero">
      <div className="rewards-hero-copy"><span className="reward-kicker"><Sparkles size={14} /> CINEWAVE REWARDS</span><h1>Xem hay hơn.<br /><em>Nhận nhiều hơn.</em></h1><p>Điểm danh, hoàn thành nhiệm vụ và mời bạn bè để tích CineXu. Dùng xu đổi voucher hoặc ngày VIP miễn phí.</p><div className="reward-hero-actions"><button onClick={jumpToActivity}>Khám phá nhiệm vụ <ChevronRight size={18} /></button><Link href="/plans">Xem gói VIP</Link></div></div>
      <div className="coin-wallet"><span className="wallet-glow" /><div className="wallet-heading"><span><Coins size={18} /> Ví CineXu</span><small>Đã đồng bộ</small></div><strong>{state.coins.toLocaleString("vi-VN")}<small> xu</small></strong><p>Còn {Math.max(0, nextMilestone - state.coins)} xu để chạm mốc {nextMilestone.toLocaleString("vi-VN")}</p><div className="wallet-progress"><i style={{ width: `${(state.coins % 500) / 5}%` }} /></div><button onClick={() => { setTab("gifts"); jumpToActivity(); }}>Đổi quà ngay <Gift size={17} /></button></div>
    </div>
    <section className="checkin-card"><div className="checkin-copy"><span><Zap size={18} /> CHUỖI ĐIỂM DANH</span><h2>{state.streak} ngày liên tiếp</h2><p>Quay lại mỗi ngày, phần thưởng sẽ tăng dần.</p></div><div className="checkin-week">{[20,30,40,50,60,80,100].map((coin, index) => { const done = index < state.streak; const today = index === state.streak; return <div className={`${done ? "is-done" : ""} ${today ? "is-today" : ""}`} key={coin}><small>Ngày {index + 1}</small><span>{done ? <Check size={17} /> : index === 6 ? <Gift size={18} /> : <Coins size={17} />}</span><strong>+{coin}</strong></div>; })}</div><button className="checkin-button" disabled={checkedToday} onClick={checkIn}>{checkedToday ? <><Check size={18} /> Đã điểm danh</> : "Điểm danh hôm nay"}</button></section>
    <section className="coupon-section"><div className="reward-section-heading"><div><span>ƯU ĐÃI DÀNH CHO BẠN</span><h2>Mã tốt đang chờ</h2></div><small><Clock3 size={14} /> Cập nhật mỗi tuần</small></div><div className="coupon-grid">{coupons.map(({ icon: Icon, ...coupon }) => <article className={`coupon-card coupon-${coupon.color}`} key={coupon.id}><div className="coupon-top"><span><Icon size={18} /></span><small>{coupon.label}</small><b>{coupon.expiry}</b></div><h3>{coupon.title}</h3><p>{coupon.note}</p><div className="coupon-code"><code>{coupon.code}</code><button onClick={() => copy(coupon.code)}><Copy size={16} /> Sao chép</button></div></article>)}</div></section>
    <section className="invite-banner"><div className="invite-icon"><UserPlus size={28} /></div><div><span>QUÀ TẶNG NHÂN ĐÔI</span><h2>Rủ bạn xem chung, cả hai cùng có VIP</h2><p>Bạn nhận 200 CineXu, người bạn được giảm 50% khi kích hoạt gói đầu tiên.</p></div><button onClick={invite}><Share2 size={18} /> Mời bạn ngay</button></section>
    <section className="reward-activity" id="reward-missions"><div className="reward-tabs"><button className={tab === "missions" ? "is-active" : ""} onClick={() => setTab("missions")}>Nhiệm vụ <span>{missions.length}</span></button><button className={tab === "gifts" ? "is-active" : ""} onClick={() => setTab("gifts")}>Kho đổi quà <span>{gifts.length}</span></button></div>
      {tab === "missions" ? <div className="mission-list">{missions.map(({ icon: Icon, ...mission }) => { const claimed = state.claimed.includes(mission.id); return <article key={mission.id}><span className="mission-icon"><Icon size={21} /></span><div className="mission-copy"><h3>{mission.title}</h3><p>{mission.detail}</p><div><i style={{ width: `${mission.progress}%` }} /></div></div><strong>+{mission.coins} <Coins size={14} /></strong><button disabled={mission.progress < 100 || claimed} onClick={() => claimMission(mission.id, mission.coins)}>{claimed ? "Đã nhận" : mission.progress === 100 ? "Nhận xu" : `${mission.progress}%`}</button></article>; })}</div>
      : <div className="gift-grid">{gifts.map(({ icon: Icon, ...gift }) => { const redeemed = state.redeemed.includes(gift.id); const locked = state.coins < gift.price; return <article key={gift.id}><span className="gift-tag">{gift.tag}</span><div className="gift-icon"><Icon size={30} /></div><h3>{gift.title}</h3><p><Coins size={15} /> {gift.price.toLocaleString("vi-VN")} CineXu</p><button disabled={redeemed} onClick={() => redeem(gift.id, gift.title, gift.price)}>{redeemed ? <><Check size={16} /> Đã đổi</> : locked ? <><LockKeyhole size={15} /> Chưa đủ xu</> : "Đổi ngay"}</button></article>; })}</div>}
    </section>
    <p className="reward-terms">CineXu không có giá trị quy đổi thành tiền mặt. Ưu đãi có thể thay đổi theo từng thời điểm. <Link href="/about">Xem thể lệ chương trình</Link>.</p>
  </section>;
}

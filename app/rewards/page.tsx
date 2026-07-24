import { Footer } from "@/app/components/Footer";
import { SiteHeader } from "@/app/components/SiteHeader";
import { RewardsHub } from "@/app/components/RewardsHub";

export const metadata = { title: "Ưu đãi & CineXu | CineWave", description: "Nhận voucher, làm nhiệm vụ, điểm danh và đổi quà cùng CineWave." };

export default function RewardsPage() {
  return <main><SiteHeader /><RewardsHub /><Footer /></main>;
}

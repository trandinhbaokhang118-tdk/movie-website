import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cinewave.openai.site"),
  title: { default: "CineWave — Những câu chuyện thức giấc về đêm", template: "%s · CineWave" },
  description: "Không gian điện ảnh đêm với hồ sơ riêng, đề xuất theo cảm xúc và trải nghiệm xem an toàn.",
  applicationName: "CineWave",
  openGraph: {
    title: "CineWave — Những câu chuyện thức giấc về đêm",
    description: "Rạp phim cá nhân trong sắc tím đêm: chọn theo cảm xúc, xem liền mạch và an toàn.",
    type: "website",
    locale: "vi_VN",
    siteName: "CineWave",
    images: [{ url: "/og.png", width: 1730, height: 910, alt: "CineWave — Những câu chuyện thức giấc về đêm" }],
  },
  twitter: { card: "summary_large_image", title: "CineWave", description: "Những câu chuyện thức giấc về đêm.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}

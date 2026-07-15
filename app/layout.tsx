import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cinewave.openai.site"),
  title: { default: "CineWave — Những câu chuyện đáng nhớ", template: "%s · CineWave" },
  description: "Khám phá và xem những bộ phim tuyển chọn trong trải nghiệm điện ảnh riêng của CineWave.",
  applicationName: "CineWave",
  openGraph: {
    title: "CineWave — Những câu chuyện đáng nhớ",
    description: "Rạp phim cá nhân trên web: chọn nhanh, xem liền mạch, vận hành an toàn.",
    type: "website",
    locale: "vi_VN",
    siteName: "CineWave",
    images: [{ url: "/og.png", width: 1730, height: 910, alt: "CineWave — Những câu chuyện đáng nhớ" }],
  },
  twitter: { card: "summary_large_image", title: "CineWave", description: "Những câu chuyện đáng nhớ, phát theo cách bạn muốn.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className={manrope.variable}>{children}</body>
    </html>
  );
}

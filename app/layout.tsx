import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { GlobalTranslator } from "./components/GlobalTranslator";
import { ScrollToTop } from "./components/ScrollToTop";
import { getCurrentLocale } from "./i18n/server";
import { getViewerContext } from "./viewer-context";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: { default: "CineWave — Những câu chuyện thức giấc về đêm", template: "%s · CineWave" },
  description: "Không gian điện ảnh đêm với xu hướng theo thời gian thực, gợi ý hợp gu và Tủ phim cá nhân.",
  applicationName: "CineWave",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "CineWave — Những câu chuyện thức giấc về đêm",
    description: "Xu hướng đúng gu, gợi ý thông minh và một Tủ phim luôn sẵn sàng cho đêm nay.",
    type: "website",
    locale: "vi_VN",
    siteName: "CineWave",
    images: [{ url: "/og-trending.png", width: 1536, height: 1024, alt: "CineWave — Xu hướng đúng gu, lưu phim đúng lúc" }],
  },
  twitter: { card: "summary_large_image", title: "CineWave", description: "Xu hướng đúng gu. Lưu phim đúng lúc.", images: ["/og-trending.png"] },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getCurrentLocale();
  const context = await getViewerContext();
  return (
    <html lang={locale} data-theme={context?.profile.theme ?? "cinewave"} suppressHydrationWarning>
      <body className={manrope.variable} suppressHydrationWarning><GlobalTranslator locale={locale} />{children}<ScrollToTop /></body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { GlobalTranslator } from "./components/GlobalTranslator";
import { ScrollToTop } from "./components/ScrollToTop";
import { getCurrentLocale } from "./i18n/server";
import { getViewerContext } from "./viewer-context";
import { headers } from "next/headers";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "vietnamese"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const rawHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() || requestHeaders.get("host") || "localhost:3000";
  const host = /^[a-z0-9.-]+(?::\d{1,5})?$/i.test(rawHost) ? rawHost : "localhost:3000";
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const metadataBase = new URL(`${protocol}://${host}`);
  const socialImage = new URL("/og.png", metadataBase).toString();
  return {
  metadataBase,
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
    url: metadataBase,
    images: [{ url: socialImage, width: 1732, height: 909, alt: "CineWave — Rạp phim dành cho những câu chuyện thức giấc về đêm" }],
  },
  twitter: { card: "summary_large_image", title: "CineWave", description: "Xu hướng đúng gu. Lưu phim đúng lúc.", images: [socialImage] },
  alternates: { canonical: metadataBase },
  robots: { index: true, follow: true },
  };
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

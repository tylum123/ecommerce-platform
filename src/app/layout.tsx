import { Suspense } from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { RouteProgressBar } from "@/components/sites/nari/route-progress-bar";
import "./globals.css";

const beVietnamPro = localFont({
  src: [
    { path: "./fonts/BeVietnamPro-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/BeVietnamPro-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/BeVietnamPro-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/BeVietnamPro-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: "Arial",
});

const cormorantGaramond = localFont({
  src: "./fonts/CormorantGaramond-Variable.ttf",
  weight: "500 700",
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất | Mỹ Phẩm & Clinic Chính Hãng",
  description: "Nari Home - Hệ thống mỹ phẩm chính hãng và dịch vụ làm đẹp da liễu chuẩn y khoa hàng đầu. Khơi nguồn vẻ đẹp - Kiến tạo khí chất.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${cormorantGaramond.variable}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}


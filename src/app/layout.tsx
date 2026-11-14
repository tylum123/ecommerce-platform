import type { Metadata } from "next";
import { Be_Vietnam_Pro, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}


import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RouteProgressBar } from "@/components/sites/nari/route-progress-bar";
import { generateOrganizationJsonLd } from "@/lib/seo/seo-engine";
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

export const viewport: Viewport = {
  themeColor: "#3d2e24",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://narihome.io.vn"),
  title: {
    default: "Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất | Mỹ Phẩm Chính Hãng",
    template: "%s | Nari Home",
  },
  description:
    "Nari Home — Hệ thống phân phối mỹ phẩm chính hãng 100% từ hơn 1.000 thương hiệu làm đẹp uy tín. Giao nhanh 2H NariNow miễn phí, cam kết đền bù 200% nếu phát hiện hàng giả.",
  keywords: [
    "Nari Home",
    "mỹ phẩm chính hãng",
    "chăm sóc da mặt",
    "skincare",
    "trang điểm",
    "nước hoa chính hãng",
    "giao nhanh 2H NariNow",
    "mỹ phẩm cao cấp",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://narihome.io.vn",
    siteName: "Nari Home",
    title: "Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất | Mỹ Phẩm Chính Hãng",
    description:
      "Hệ thống phân phối mỹ phẩm chính hãng 100%, giao nhanh 2H NariNow, cam kết đền bù 200% nếu phát hiện hàng giả.",
    images: [
      {
        url: "/nari-home-banner.jpg",
        width: 1200,
        height: 630,
        alt: "Nari Home — Mỹ Phẩm Chính Hãng",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nari Home — Mỹ Phẩm Chính Hãng",
    description:
      "Khơi nguồn vẻ đẹp - Kiến tạo khí chất. Mỹ phẩm chính hãng 100%, giao nhanh 2H NariNow.",
    images: ["/nari-home-banner.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = generateOrganizationJsonLd();

  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${cormorantGaramond.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}


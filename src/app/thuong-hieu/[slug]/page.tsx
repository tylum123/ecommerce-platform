import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { BrandProducts } from "@/components/sites/nari/brand-products";
import { getAllCatalogProducts } from "@/lib/catalog";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const liveCatalog = await readStorefrontCatalog();
  const brand = liveCatalog.references?.brands.find(item => item.slug === slug);
  if (!brand) {
    return { title: "Thương hiệu", robots: { index: false, follow: false } };
  }

  const description = `Khám phá mỹ phẩm ${brand.label} chính hãng 100% tại Nari Home. Ưu đãi mỗi ngày, giao nhanh 2H NariNow, cam kết đền bù 200% nếu phát hiện hàng giả.`;
  const canonicalPath = `/thuong-hieu/${brand.slug}`;

  return {
    title: `Thương Hiệu ${brand.label} Chính Hãng`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: `https://narihome.io.vn${canonicalPath}`,
      siteName: "Nari Home",
      title: `Thương Hiệu ${brand.label} Chính Hãng | Nari Home`,
      description,
      images: [{ url: "/nari-home-banner.jpg", width: 1200, height: 630, alt: brand.label }],
    },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const liveCatalog = await readStorefrontCatalog();
  const brand = liveCatalog.references?.brands.find(item => item.slug === slug);
  if (!brand) notFound();
  const items = getAllCatalogProducts(liveCatalog).filter(product => product.brandId === brand.id);
  return <>
    <Header />
    <main className="wrap brand-detail-page">
      <div className="breadcrumbs"><Link href="/">Trang chủ</Link> › <Link href="/thuong-hieu">Thương hiệu</Link> › {brand.label}</div>
      <div className="brand-detail-heading">
        <div className="brand-detail-logo">{brand.label}</div>
        <div><h1>{brand.label}</h1><span>{items.length} sản phẩm</span><p>Chưa có mô tả đã xác minh cho thương hiệu {brand.label}.</p></div>
      </div>
      <BrandProducts name={brand.label} items={items} deals={tab === "Deal"} source="postgres" categoryOptions={(liveCatalog.references?.categories || []).map(item => [item.label, item.slug])} />
    </main>
    <Footer />
  </>;
}

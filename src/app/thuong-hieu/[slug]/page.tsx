export const dynamic = "force-dynamic";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { BrandProducts } from "@/components/sites/nari/brand-products";
import { getAllCatalogProducts } from "@/lib/catalog";
import { notFound } from "next/navigation";

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

import { ProductView } from "@/components/sites/nari/catalog-view";
import { notFound } from "next/navigation";
import { findCatalogProduct } from "@/lib/catalog";
import { getNewArrivals } from "@/lib/new-arrivals";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { NewProductView } from "@/components/sites/nari/new-product-view";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function normalizeProductSlug(s: string): string {
  return s.replace(/(?:-\d+)?\.html$/i, "").replace(/-\d+$/i, "").toLowerCase();
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liveCatalog = await readStorefrontCatalog();
  if (liveCatalog.deletedSlugs.includes(slug)) notFound();

  const catalogProduct = findCatalogProduct(slug, liveCatalog);
  if (catalogProduct) {
    const brand = liveCatalog.references?.brands.find(
      item => item.id === catalogProduct.brandId || item.label.toLocaleLowerCase("vi") === catalogProduct.brand.toLocaleLowerCase("vi")
    );
    return <ProductView slug={catalogProduct.slug} brandHref={brand ? `/thuong-hieu/${brand.slug}` : undefined} liveCatalog={liveCatalog} />;
  }

  const targetNorm = normalizeProductSlug(slug);
  const item = getNewArrivals(liveCatalog).find(
    product => product.slug === slug || normalizeProductSlug(product.slug) === targetNorm
  );
  if (item) {
    return <NewProductView item={item} />;
  }

  notFound();
}

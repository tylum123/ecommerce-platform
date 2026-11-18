import { ProductView } from "@/components/sites/hasaki/catalog-view";
import { notFound } from "next/navigation";
import { getAllCatalogProducts, findCatalogProduct } from "@/lib/catalog";
import { newArrivals, getNewArrivals } from "@/lib/new-arrivals";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { NewProductView } from "@/components/sites/hasaki/new-product-view";
import brandsRaw from "../../../../docs/research/hasaki/brands-source.json";

interface BrandItem {
  name: string;
  url: string;
}

const brands = brandsRaw as BrandItem[];

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  const catalogSlugs = getAllCatalogProducts().map(item => item.slug);
  const newArrivalSlugs = newArrivals.map(item => item.slug);
  const uniqueSlugs = Array.from(new Set([...catalogSlugs, ...newArrivalSlugs]));
  return uniqueSlugs.map(slug => ({ slug }));
}

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

  // 1. First check catalog products across core, category snapshots, deals, bestsellers, and brands
  const catalogProduct = findCatalogProduct(slug, liveCatalog);
  if (catalogProduct) {
    if (liveCatalog.source === "postgres") {
      const brand = liveCatalog.references?.brands.find(item => item.id === catalogProduct.brandId);
      return <ProductView slug={catalogProduct.slug} brandHref={brand ? `/thuong-hieu/${brand.slug}` : undefined} liveCatalog={liveCatalog} />;
    }
    const brand = brands.find(
      item => item.name.toLocaleLowerCase("vi") === catalogProduct.brand.toLocaleLowerCase("vi")
    );
    return <ProductView slug={catalogProduct.slug} brandHref={brand?.url} liveCatalog={liveCatalog} />;
  }

  // 2. Next check new arrivals snapshot (exact or normalized slug)
  const targetNorm = normalizeProductSlug(slug);
  const item = getNewArrivals(liveCatalog).find(
    product => product.slug === slug || normalizeProductSlug(product.slug) === targetNorm
  );
  if (item) {
    return <NewProductView item={item} />;
  }

  notFound();
}

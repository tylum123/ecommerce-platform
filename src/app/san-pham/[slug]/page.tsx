import type { Metadata } from "next";
import { ProductView } from "@/components/sites/nari/catalog-view";
import { notFound } from "next/navigation";
import { findCatalogProduct, money } from "@/lib/catalog";
import { getNewArrivals } from "@/lib/new-arrivals";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { NewProductView } from "@/components/sites/nari/new-product-view";
import { generateProductJsonLd } from "@/lib/seo/seo-engine";

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function normalizeProductSlug(s: string): string {
  return s.replace(/(?:-\d+)?\.html$/i, "").replace(/-\d+$/i, "").toLowerCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const liveCatalog = await readStorefrontCatalog();
  if (liveCatalog.deletedSlugs.includes(slug)) {
    return { title: "Không tìm thấy sản phẩm", robots: { index: false, follow: false } };
  }

  const catalogProduct = findCatalogProduct(slug, liveCatalog);
  if (catalogProduct) {
    const priceText = catalogProduct.price > 0 ? ` — Giá ${money(catalogProduct.price)}` : "";
    const shortDesc = catalogProduct.description
      ? catalogProduct.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
      : "Cam kết chính hãng 100%, giao nhanh 2H NariNow.";
    const description = `${catalogProduct.brand ? `${catalogProduct.brand} | ` : ""}${catalogProduct.name}${priceText}. ${shortDesc}`;
    const canonicalPath = `/san-pham/${catalogProduct.slug}`;
    const ogImage = catalogProduct.image || "/nari-home-banner.jpg";

    return {
      title: catalogProduct.name,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "website",
        locale: "vi_VN",
        url: `https://narihome.io.vn${canonicalPath}`,
        siteName: "Nari Home",
        title: `${catalogProduct.name} | Nari Home`,
        description,
        images: [{ url: ogImage, alt: catalogProduct.name }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${catalogProduct.name} | Nari Home`,
        description,
        images: [ogImage],
      },
    };
  }

  const targetNorm = normalizeProductSlug(slug);
  const item = getNewArrivals(liveCatalog).find(
    product => product.slug === slug || normalizeProductSlug(product.slug) === targetNorm
  );
  if (item) {
    const priceText = item.numericPrice > 0 ? ` — Giá ${money(item.numericPrice)}` : "";
    const shortDesc = item.description
      ? item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
      : "Cam kết chính hãng 100%, giao nhanh 2H NariNow.";
    const description = `${item.brand ? `${item.brand} | ` : ""}${item.name}${priceText}. ${shortDesc}`;
    const canonicalPath = `/san-pham/${item.slug}`;
    const ogImage = item.image || "/nari-home-banner.jpg";

    return {
      title: item.name,
      description,
      alternates: {
        canonical: canonicalPath,
      },
      openGraph: {
        type: "website",
        locale: "vi_VN",
        url: `https://narihome.io.vn${canonicalPath}`,
        siteName: "Nari Home",
        title: `${item.name} | Nari Home`,
        description,
        images: [{ url: ogImage, alt: item.name }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${item.name} | Nari Home`,
        description,
        images: [ogImage],
      },
    };
  }

  return { title: "Không tìm thấy sản phẩm", robots: { index: false, follow: false } };
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
    const productJsonLd = generateProductJsonLd({
      name: catalogProduct.name,
      slug: catalogProduct.slug,
      price: catalogProduct.price,
      old: catalogProduct.old,
      sale: catalogProduct.sale,
      brand: catalogProduct.brand,
      sku: catalogProduct.sku,
      id: catalogProduct.id,
      image: catalogProduct.image,
      description: catalogProduct.description,
      rating: catalogProduct.rating,
      reviewCount: catalogProduct.reviewCount,
      inStock: true,
    });
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <ProductView slug={catalogProduct.slug} brandHref={brand ? `/thuong-hieu/${brand.slug}` : undefined} liveCatalog={liveCatalog} />
      </>
    );
  }

  const targetNorm = normalizeProductSlug(slug);
  const item = getNewArrivals(liveCatalog).find(
    product => product.slug === slug || normalizeProductSlug(product.slug) === targetNorm
  );
  if (item) {
    const productJsonLd = generateProductJsonLd({
      name: item.name,
      slug: item.slug,
      price: item.numericPrice,
      old: item.numericOld,
      brand: item.brand,
      image: item.image,
      description: item.description,
      inStock: true,
    });
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
        <NewProductView item={item} />
      </>
    );
  }

  notFound();
}

import type { Metadata } from "next";
import { CategoryView } from "@/components/sites/nari/catalog-view";
import { notFound } from "next/navigation";
import { categories, resolveCategorySlug } from "@/lib/catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const liveCatalog = await readStorefrontCatalog();
  const dbCategory = liveCatalog.references?.categories.find(category => category.slug === slug);
  const resolvedSlug = liveCatalog.source === "postgres" ? dbCategory?.slug : resolveCategorySlug(slug);
  if (!resolvedSlug) {
    return { title: "Danh mục sản phẩm", robots: { index: false, follow: false } };
  }

  const categoryLabel =
    dbCategory?.label ||
    categories.find(([, catSlug]) => catSlug === resolvedSlug)?.[0] ||
    resolvedSlug;
  const description = `Mua sắm ${categoryLabel} chính hãng 100% tại Nari Home. Giá tốt mỗi ngày, giao nhanh 2H NariNow, cam kết đền bù 200% nếu phát hiện hàng giả.`;
  const canonicalPath = `/danh-muc/${resolvedSlug}`;

  return {
    title: `${categoryLabel} Chính Hãng`,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: `https://narihome.io.vn${canonicalPath}`,
      siteName: "Nari Home",
      title: `${categoryLabel} Chính Hãng | Nari Home`,
      description,
      images: [{ url: "/nari-home-banner.jpg", width: 1200, height: 630, alt: categoryLabel }],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const liveCatalog = await readStorefrontCatalog();
  const resolvedSlug = liveCatalog.source === "postgres" ? liveCatalog.references?.categories.find(category => category.slug === slug)?.slug : resolveCategorySlug(slug);
  if (!resolvedSlug) notFound();
  return <CategoryView slug={resolvedSlug} liveCatalog={liveCatalog} />;
}

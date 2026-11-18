import { CategoryView } from "@/components/sites/hasaki/catalog-view";
import { notFound } from "next/navigation";
import { resolveCategorySlug } from "@/lib/catalog";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";

export const dynamic = "force-dynamic";

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

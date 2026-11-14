import { NextResponse } from "next/server";
import { getInteractiveUiData, searchCatalogLive } from "@/lib/interactive-ui";
import { findCatalogProduct } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Public snapshot/configuration only. Operational inventory stays private. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (q !== null) {
    return NextResponse.json({ ok: true, query: q, ...searchCatalogLive(q, 6), source: "catalog-snapshot" });
  }

  const uiData = getInteractiveUiData();
  const slug = searchParams.get("slug");
  if (slug) {
    const product = findCatalogProduct(slug);
    if (!product) return NextResponse.json({ ok: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
    return NextResponse.json({
      ok: true,
      source: "catalog-snapshot",
      branchStock: null,
      data: { slug: product.slug, stock: null, giftBill: null, availability: "unavailable", productDetailPageUi: uiData.productDetailPageUi },
    });
  }

  return NextResponse.json({ ok: true, source: "ui-snapshot", data: uiData });
}

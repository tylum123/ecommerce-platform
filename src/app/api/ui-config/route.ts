import { NextResponse } from "next/server";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import {
  getInteractiveUiData,
  searchCatalogLive,
  type BranchStockItem,
  type ProductBranchStockSummary,
} from "@/lib/interactive-ui";
import { findCatalogProduct } from "@/lib/catalog";
import { getPostgresDatabase, readHyperdriveConnectionString } from "@/lib/server/postgres-database";

export const dynamic = "force-dynamic";

async function readPostgresProductBranchStock(slug: string): Promise<ProductBranchStockSummary | null> {
  if (!process.env.NARI_POSTGRES_URL && !readHyperdriveConnectionString()) {
    return null;
  }

  try {
    const db = getPostgresDatabase();
    const res = await db.query(
      `SELECT
         p.sku,
         p.slug,
         p.name AS product_name,
         b.id AS branch_id,
         b.name AS branch_name,
         b.supports_nowfree_2h,
         COALESCE(ib.total_stock, 0)::int AS total_stock,
         COALESCE(ib.reserved_stock, 0)::int AS reserved_stock,
         GREATEST(0, COALESCE(ib.total_stock, 0) - COALESCE(ib.reserved_stock, 0))::int AS available_stock
       FROM nari_catalog.products p
       JOIN nari_catalog.branches b
         ON b.is_active = true AND NOT b.is_demo
       LEFT JOIN nari_catalog.inventory_balances ib
         ON ib.product_id = p.id AND ib.branch_id = b.id
       WHERE p.slug = $1
         AND p.hidden_at IS NULL
         AND NOT p.is_demo
       ORDER BY b.name ASC`,
      [slug],
    );

    if (res.rows.length === 0) {
      return null;
    }

    const first = res.rows[0];
    let totalStock = 0;
    let availableStock = 0;
    let nowFree2HAvailable = false;

    const branches: BranchStockItem[] = res.rows.map((row) => {
      const rowTotal = Math.max(0, Number(row.total_stock) || 0);
      const rowAvail = Math.max(0, Number(row.available_stock) || 0);
      totalStock += rowTotal;
      availableStock += rowAvail;
      if (Boolean(row.supports_nowfree_2h) && rowAvail > 0) {
        nowFree2HAvailable = true;
      }
      return {
        branchId: String(row.branch_id ?? ""),
        branchName: String(row.branch_name ?? ""),
        quantity: rowAvail,
        inStock: rowAvail > 0,
      };
    });

    const branchesWithStockCount = branches.filter((b) => b.inStock).length;
    const inStock = availableStock > 0;
    const warehouseStatus: ProductBranchStockSummary["warehouseStatus"] =
      availableStock <= 0 ? "out_of_stock" : availableStock < 20 ? "low_stock" : "in_stock";

    return {
      sku: String(first.sku ?? ""),
      productSlug: String(first.slug ?? slug),
      productName: String(first.product_name ?? ""),
      totalStock,
      availableStock,
      warehouseStatus,
      inStock,
      nowFree2HAvailable,
      branchesWithStockCount,
      branches,
      stockBadgeText: inStock
        ? `Còn ${branchesWithStockCount}/${branches.length} chi nhánh có hàng`
        : "Tạm hết hàng tại các chi nhánh",
    };
  } catch {
    return null;
  }
}

/** Public storefront UI configuration and aggregated branch stock availability. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (q !== null) {
    return NextResponse.json({
      ok: true,
      query: q,
      ...searchCatalogLive(q, 6, await readStorefrontCatalog()),
      source: "catalog-runtime-overrides-on-snapshot",
    });
  }

  const uiData = getInteractiveUiData();
  const slug = searchParams.get("slug");
  if (slug) {
    const product = findCatalogProduct(slug, await readStorefrontCatalog());
    if (!product) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy sản phẩm." }, { status: 404 });
    }
    const branchStock = await readPostgresProductBranchStock(product.slug);
    return NextResponse.json({
      ok: true,
      source: branchStock ? "postgres" : "catalog-runtime-overrides-on-snapshot",
      branchStock,
      data: {
        slug: product.slug,
        stock: branchStock ? branchStock.availableStock : null,
        giftBill: null,
        availability: branchStock ? (branchStock.inStock ? "in_stock" : "out_of_stock") : "unavailable",
        productDetailPageUi: uiData.productDetailPageUi,
      },
    });
  }

  return NextResponse.json({ ok: true, source: "ui-snapshot", data: uiData });
}

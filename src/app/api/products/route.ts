import { NextResponse } from "next/server";
import { queryProducts, type ProductQueryParams } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || undefined;
    const brand = searchParams.get("brand") || undefined;
    const q = searchParams.get("q") || undefined;
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const onSaleParam = searchParams.get("onSale");
    const sortParam = searchParams.get("sort");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const minPrice = minPriceParam !== null ? parseFloat(minPriceParam) : undefined;
    const maxPrice = maxPriceParam !== null ? parseFloat(maxPriceParam) : undefined;
    const onSale = onSaleParam === "true" || onSaleParam === "1";

    let sort: ProductQueryParams["sort"];
    if (sortParam === "topsale" || sortParam === "low" || sortParam === "high" || sortParam === "discount" || sortParam === "popular") {
      sort = sortParam;
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const result = await queryProducts({
      category,
      brand,
      q,
      minPrice: !isNaN(minPrice ?? NaN) ? minPrice : undefined,
      maxPrice: !isNaN(maxPrice ?? NaN) ? maxPrice : undefined,
      onSale,
      sort,
      page: !isNaN(page) ? page : 1,
      limit: !isNaN(limit) ? limit : 20,
    });

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const unavailable = code === "CATALOG_POSTGRES_UNAVAILABLE" || code === "CATALOG_BACKEND_REQUIRED";
    return NextResponse.json(
      { ok: false, code: unavailable ? code : "PRODUCTS_QUERY_FAILED", error: unavailable ? "Danh mục hiện chưa sẵn sàng." : "Không thể tải danh sách sản phẩm." },
      { status: unavailable ? 503 : 500 }
    );
  }
}

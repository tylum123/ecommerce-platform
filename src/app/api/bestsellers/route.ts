import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { NextResponse } from "next/server";
import {
  getBestsellersSnapshot,
  getDealCategories,
  matchesCategory,
  type BestsellerProduct,
} from "@/lib/deals-bestsellers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "";
    const q = searchParams.get("q") || "";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const liveCatalog = await readStorefrontCatalog();
    const allBestsellers = getBestsellersSnapshot(liveCatalog);
    const categories = getDealCategories(liveCatalog);

    let filtered: BestsellerProduct[] = allBestsellers;

    // Filter by category
    if (category.trim()) {
      filtered = filtered.filter(item => matchesCategory(item.category, category.trim()));
    }

    // Filter by search query
    if (q.trim()) {
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter(item => {
        const text = `${item.name} ${item.brand} ${item.category}`.toLowerCase();
        return terms.every(t => text.includes(t));
      });
    }

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const safePage = Math.max(1, !isNaN(page) ? page : 1);
    const safeLimit = Math.max(1, Math.min(100, !isNaN(limit) ? limit : 50));
    const total = filtered.length;
    const totalPages = Math.ceil(total / safeLimit) || 1;
    const startIndex = (safePage - 1) * safeLimit;
    const items = filtered.slice(startIndex, startIndex + safeLimit);

    return NextResponse.json({
      ok: true,
      source: liveCatalog.source === "postgres" ? "postgres-ranking-not-migrated" : "snapshot-2026-11-13-with-catalog-overrides",
      categories,
      data: {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

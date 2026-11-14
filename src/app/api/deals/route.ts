import { NextResponse } from "next/server";
import {
  getDealsSnapshot,
  getDealCategories,
  matchesCategory,
  type DealProduct,
} from "@/lib/deals-bestsellers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") || "";
    const q = searchParams.get("q") || "";
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const allDeals = getDealsSnapshot();
    const categories = getDealCategories();

    let filtered: DealProduct[] = allDeals;

    // Filter by category
    if (category.trim()) {
      filtered = filtered.filter(deal => matchesCategory(deal.category, category.trim()));
    }

    // Filter by search query
    if (q.trim()) {
      const terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      filtered = filtered.filter(deal => {
        const text = `${deal.name} ${deal.brand} ${deal.category}`.toLowerCase();
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

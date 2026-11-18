export const dynamic = "force-dynamic";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { DealsList } from "@/components/sites/nari/deals-list";
import {
  getDealsSnapshot,
  getDealCategories,
  filterDealProducts
} from "@/lib/deals-bestsellers";

export default async function DealsPage({
  searchParams
}: {
  searchParams: Promise<{ filter_category?: string; product_list_order?: string }>;
}) {
  const { filter_category = "", product_list_order = "topsale" } = await searchParams;
  const liveCatalog = await readStorefrontCatalog();
  const filters = getDealCategories(liveCatalog);
  const selected = filters.find(filter => filter.id === filter_category);
  const allDeals = getDealsSnapshot(liveCatalog);
  const items = selected
    ? filterDealProducts(allDeals, {
        categoryId: filter_category,
        sort: product_list_order
      })
    : [];

  return (
    <>
      <Header />
      <main className="wrap deals-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Flash Deal
        </div>
        <h1>ϟ FLASH DEAL</h1>
        <p className="deals-notice">
          Sản phẩm và giá là dữ liệu ảnh chụp ngày 13/11/2026; không phản ánh chương trình khuyến mãi hiện tại. Giỏ hàng là mô phỏng frontend.
        </p>
        <nav className="deals-filters" aria-label="Danh mục deals">
          {filters.map(filter => {
            const params = new URLSearchParams({ product_list_order });
            if (filter.id) params.set("filter_category", filter.id);
            return (
              <Link
                key={filter.id}
                className={filter.id === filter_category ? "selected" : ""}
                aria-current={filter.id === filter_category ? "page" : undefined}
                href={`/deals-dang-dien-ra.html?${params}`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>
        {!selected && <p>Danh mục này chưa có trong dữ liệu mẫu.</p>}
        <DealsList items={items} />
      </main>
      <Footer />
    </>
  );
}

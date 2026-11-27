import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Shimmering Luxury Silk skeleton block primitive. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("nari-shimmer rounded", className)} aria-hidden="true" />;
}

/** Storefront promo strip, main header, and sub-navigation skeleton. */
export function StorefrontHeaderSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải thanh điều hướng">
      <div className="h-[42px] bg-[#3d2e24]/90" />
      <div className="h-[84px] border-b border-[#e2ceba] bg-[#f6ece3]">
        <div className="wrap flex h-full items-center gap-3 sm:gap-6">
          <SkeletonBlock className="h-9 w-32 shrink-0 rounded-md sm:w-40" />
          <SkeletonBlock className="h-10 min-w-0 flex-1 rounded-full" />
          <div className="hidden items-center gap-3 sm:flex">
            <SkeletonBlock className="h-8 w-24 rounded-md" />
            <SkeletonBlock className="h-8 w-24 rounded-md" />
            <SkeletonBlock className="h-8 w-16 rounded-md" />
          </div>
        </div>
      </div>
      <div className="h-[40px] border-b border-[#eadbcf] bg-[#fdfaf7]">
        <div className="wrap flex h-full items-center gap-4 overflow-hidden">
          <SkeletonBlock className="h-4 w-24 shrink-0" />
          <SkeletonBlock className="h-4 w-20 shrink-0" />
          <SkeletonBlock className="h-4 w-24 shrink-0" />
          <SkeletonBlock className="hidden h-4 w-20 shrink-0 sm:block" />
          <SkeletonBlock className="hidden h-4 w-28 shrink-0 md:block" />
        </div>
      </div>
    </div>
  );
}

/** Single product card Luxury Silk skeleton. */
export function ProductCardSkeleton() {
  return (
    <div className="product flex flex-col bg-white p-2.5 sm:p-3" aria-busy="true">
      <SkeletonBlock className="h-[135px] w-full rounded sm:h-[170px]" />
      <div className="mt-2.5 flex items-center gap-2">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-4 w-10" />
      </div>
      <SkeletonBlock className="mt-2 h-3 w-1/3" />
      <SkeletonBlock className="mt-1.5 h-3.5 w-full" />
      <SkeletonBlock className="mt-1 h-3.5 w-4/5" />
      <SkeletonBlock className="mt-2.5 h-3 w-1/2" />
      <SkeletonBlock className="mt-3 h-8 w-full rounded" />
    </div>
  );
}

/** Responsive product grid skeleton matching storefront card columns. */
export function ProductGridSkeleton({
  count = 6,
  columnsClass = "grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
}: {
  count?: number;
  columnsClass?: string;
}) {
  return (
    <div className={cn(columnsClass)} aria-busy="true" aria-label="Đang tải danh sách sản phẩm">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/** Product detail route skeleton with 3-column hero and lower rich tabs. */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải chi tiết sản phẩm">
      <StorefrontHeaderSkeleton />
      <main className="wrap pb-10">
        <div className="breadcrumbs flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-3.5 w-16" />
          <SkeletonBlock className="h-3.5 w-24" />
          <SkeletonBlock className="h-3.5 w-40 max-w-full" />
        </div>

        <div className="detail">
          <div className="detail-gallery">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="hidden flex-col gap-2 sm:flex">
                <SkeletonBlock className="h-14 w-14 rounded" />
                <SkeletonBlock className="h-14 w-14 rounded" />
                <SkeletonBlock className="h-14 w-14 rounded" />
                <SkeletonBlock className="h-14 w-14 rounded" />
              </div>
              <SkeletonBlock className="h-[260px] w-full flex-1 rounded sm:h-[380px]" />
            </div>
          </div>

          <div className="detail-info space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-6 w-full" />
            <SkeletonBlock className="h-6 w-3/4" />
            <SkeletonBlock className="h-4 w-36" />
            <div className="rounded bg-[#fbf8f5] p-3.5">
              <div className="flex items-center gap-3">
                <SkeletonBlock className="h-7 w-32" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
            </div>
            <SkeletonBlock className="h-14 w-full rounded border border-dashed border-[#e6d5c5]" />
            <div className="flex items-center gap-3 pt-1">
              <SkeletonBlock className="h-10 w-28" />
              <SkeletonBlock className="h-10 flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-full" />
            </div>
          </div>

          <aside className="detail-side space-y-3">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <hr />
            <SkeletonBlock className="h-24 w-full" />
          </aside>
        </div>

        <div className="detail-lower-grid">
          <div className="rounded-md border border-[#ebd6c4] bg-white p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap gap-2 border-b border-[#ebd6c4] pb-3">
              <SkeletonBlock className="h-8 w-28" />
              <SkeletonBlock className="h-8 w-24" />
              <SkeletonBlock className="h-8 w-24" />
            </div>
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-11/12" />
            <SkeletonBlock className="h-4 w-4/5" />
            <SkeletonBlock className="h-40 w-full rounded-md" />
          </div>
          <div className="detail-lower-side">
            <div className="rounded-md border border-[#ebd6c4] bg-white p-4 space-y-3">
              <SkeletonBlock className="h-5 w-40" />
              <SkeletonBlock className="h-16 w-full" />
              <SkeletonBlock className="h-16 w-full" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Category/catalog route skeleton with filters sidebar and 8-card product grid. */
export function CatalogPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải danh mục sản phẩm">
      <StorefrontHeaderSkeleton />
      <main className="wrap pb-10">
        <div className="breadcrumbs flex items-center gap-2">
          <SkeletonBlock className="h-3.5 w-16" />
          <SkeletonBlock className="h-3.5 w-28" />
        </div>

        <div className="listing">
          <aside className="filters space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-4/5" />
            <SkeletonBlock className="h-4 w-3/4" />
            <div className="hidden space-y-2.5 pt-3 md:block">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-8 w-full" />
            </div>
          </aside>

          <section className="listing-main space-y-3 pt-4">
            <SkeletonBlock className="h-[90px] w-full rounded-md sm:h-[140px]" />
            <div className="listing-header flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-6 w-40" />
                <SkeletonBlock className="h-4 w-16" />
              </div>
              <SkeletonBlock className="h-9 w-36" />
            </div>
            <ProductGridSkeleton count={8} columnsClass="listing-cards" />
          </section>
        </div>
      </main>
    </div>
  );
}

/** Checkout route skeleton with top bar and two-column form/summary layout. */
export function CheckoutPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải trang thanh toán">
      <div className="cart-top">
        <div className="wrap">
          <SkeletonBlock className="h-9 w-32 shrink-0 sm:w-40" />
          <SkeletonBlock className="h-6 w-44 max-w-full" />
          <SkeletonBlock className="ml-auto hidden h-4 w-28 sm:block" />
        </div>
      </div>

      <main className="wrap cart-page py-6">
        <div className="cart-layout">
          <div className="space-y-4">
            <div className="cart-box space-y-3.5">
              <SkeletonBlock className="h-5 w-48" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
            <div className="cart-box space-y-3">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="h-14 w-full" />
              <SkeletonBlock className="h-14 w-full" />
            </div>
          </div>

          <aside className="cart-box cart-summary space-y-4">
            <SkeletonBlock className="h-5 w-36" />
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-24" />
              </div>
            </div>
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-6 w-full" />
            <SkeletonBlock className="h-12 w-full rounded" />
          </aside>
        </div>
      </main>
    </div>
  );
}

/** Order lookup route skeleton with storefront header and centered lookup form card. */
export function OrderLookupSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải trang tra cứu đơn hàng">
      <StorefrontHeaderSkeleton />
      <main className="wrap min-h-[65vh] pb-10">
        <div className="breadcrumbs flex items-center gap-2">
          <SkeletonBlock className="h-3.5 w-16" />
          <SkeletonBlock className="h-3.5 w-28" />
        </div>

        <section className="mx-auto mt-3 max-w-[680px] space-y-4 rounded-md border border-[#ebd6c4] bg-white p-6 sm:p-7">
          <SkeletonBlock className="h-7 w-64 max-w-full" />
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-4 w-3/4" />
          <div className="space-y-2 pt-2">
            <SkeletonBlock className="h-3.5 w-28" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock className="h-3.5 w-36" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
          <SkeletonBlock className="h-11 w-full rounded" />
        </section>
      </main>
    </div>
  );
}

/** Inline order result card skeleton shown during client order lookup fetch. */
export function OrderResultSkeleton() {
  return (
    <div
      className="mx-auto mt-5 max-w-[680px] space-y-4 rounded-md border border-[#ebd6c4] bg-white p-5 sm:p-6"
      aria-busy="true"
      aria-label="Đang tra cứu thông tin đơn hàng"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="h-6 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
        <SkeletonBlock className="h-10 w-full" />
      </div>
      <div className="space-y-2.5 border-t border-[#ebd6c4] pt-3">
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-[#ebd6c4] pt-3">
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="h-6 w-32" />
      </div>
    </div>
  );
}

/** Customer portal route skeleton with account sidebar and main profile/orders panel. */
export function CustomerPortalSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải cổng khách hàng">
      <StorefrontHeaderSkeleton />
      <main className="wrap py-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e6d5c5] bg-white p-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-5 w-44" />
            <SkeletonBlock className="h-3.5 w-60 max-w-full" />
          </div>
          <SkeletonBlock className="h-8 w-24 rounded-md" />
        </div>

        <div className="portal-layout-grid">
          <aside className="space-y-2.5 rounded-lg border border-[#e6d5c5] bg-white p-4">
            <SkeletonBlock className="h-12 w-full rounded" />
            <SkeletonBlock className="h-9 w-full rounded" />
            <SkeletonBlock className="h-9 w-full rounded" />
            <SkeletonBlock className="h-9 w-full rounded" />
            <SkeletonBlock className="h-9 w-full rounded" />
            <SkeletonBlock className="h-9 w-full rounded" />
          </aside>

          <section className="space-y-4 rounded-lg border border-[#e6d5c5] bg-white p-5 sm:p-6">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-72 max-w-full" />
            <div className="max-w-xl space-y-3 pt-1">
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-10 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-10 w-36 rounded-lg" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/** Reusable admin data table skeleton for ERP and product management views. */
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-[#e6d5c5] bg-white"
      aria-busy="true"
      aria-label="Đang tải bảng dữ liệu quản trị"
    >
      <div className="grid grid-cols-4 gap-3 border-b border-[#e6d5c5] bg-[#faf5f0] px-4 py-3">
        <SkeletonBlock className="h-3.5 w-20 max-w-full" />
        <SkeletonBlock className="h-3.5 w-24 max-w-full" />
        <SkeletonBlock className="h-3.5 w-16 max-w-full" />
        <SkeletonBlock className="h-3.5 w-14 max-w-full" />
      </div>
      <div className="divide-y divide-[#f3e8dc]">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-4 items-center gap-3 px-4 py-3.5">
            <SkeletonBlock className="h-4 w-4/5" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-6 w-16 max-w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin ERP portal skeleton with header bar, 4 KPI cards, tabs, and data table. */
export function AdminErpSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải cổng quản trị ERP">
      <div className="border-b border-[#2a1f18]/30 bg-[#3d2e24] px-4 py-4">
        <div className="wrap flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-60 max-w-full rounded bg-[#6e5a4f]/50" />
            <div className="h-3.5 w-72 max-w-full rounded bg-[#6e5a4f]/40" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-8 w-24 rounded bg-[#6e5a4f]/50" />
            <div className="h-8 w-24 rounded bg-[#6e5a4f]/50" />
            <div className="h-8 w-20 rounded bg-[#6e5a4f]/50" />
          </div>
        </div>
      </div>

      <div className="border-b border-[#e6d5c5] bg-white">
        <div className="wrap flex items-center gap-4 overflow-hidden px-4 py-3">
          <SkeletonBlock className="h-6 w-28 shrink-0" />
          <SkeletonBlock className="h-6 w-32 shrink-0" />
          <SkeletonBlock className="h-6 w-28 shrink-0" />
          <SkeletonBlock className="hidden h-6 w-32 shrink-0 sm:block" />
          <SkeletonBlock className="hidden h-6 w-28 shrink-0 md:block" />
        </div>
      </div>

      <div className="wrap space-y-6 px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-[#e6d5c5] bg-white p-5">
              <SkeletonBlock className="h-3.5 w-24" />
              <SkeletonBlock className="h-7 w-32" />
              <SkeletonBlock className="h-3 w-20" />
            </div>
          ))}
        </div>

        <AdminTableSkeleton rows={6} />
      </div>
    </div>
  );
}

/** Cart drawer line-item skeleton used while hydrating cart product details. */
export function CartDrawerItemsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải sản phẩm trong giỏ hàng">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg border border-[#ebd6c4] bg-white p-3"
        >
          <SkeletonBlock className="h-16 w-16 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-3.5 w-full" />
            <SkeletonBlock className="h-3 w-1/3" />
            <SkeletonBlock className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lightweight Luxury Silk backdrop spinner card for modal or async dialog loading states. */
export function ModalLoadingOverlay({ label = "Đang tải..." }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b18]/35 p-4 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 rounded-xl border border-[#e6d5c5] bg-[#faf5f0] px-5 py-3.5 text-sm font-semibold text-[#3d2e24] shadow-lg">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#b86b4b]" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}

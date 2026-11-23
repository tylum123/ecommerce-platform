import {
  ProductGridSkeleton,
  SkeletonBlock,
  StorefrontHeaderSkeleton,
} from "@/components/sites/nari/ui-skeletons";

/** Route-level Luxury Silk skeleton fallback during dynamic SSR transitions. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải nội dung">
      <StorefrontHeaderSkeleton />
      <div className="wrap space-y-4 py-5">
        <SkeletonBlock className="h-[180px] w-full rounded-lg sm:h-[240px]" />
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}

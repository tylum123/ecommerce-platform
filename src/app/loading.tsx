/** Route-level Luxury Silk skeleton fallback during dynamic SSR transitions. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf5f0]" aria-busy="true" aria-label="Đang tải nội dung">
      <div className="h-[42px] bg-[#3d2e24]/90" />
      <div className="h-[84px] border-b border-[#e2ceba] bg-[#f6ece3]">
        <div className="wrap flex h-full items-center gap-6">
          <div className="h-10 w-40 animate-pulse rounded-md bg-[#e6d5c5]" />
          <div className="h-10 flex-1 animate-pulse rounded-full bg-white/80" />
          <div className="hidden h-9 w-56 animate-pulse rounded-md bg-[#e6d5c5] sm:block" />
        </div>
      </div>
      <div className="wrap py-5 space-y-4">
        <div className="h-[240px] w-full animate-pulse rounded-lg bg-[#efe2d4]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-lg border border-[#ebd6c4] bg-white p-3">
              <div className="h-32 w-full rounded bg-[#f6ece3]" />
              <div className="mt-3 h-4 w-2/3 rounded bg-[#efe2d4]" />
              <div className="mt-2 h-3 w-full rounded bg-[#f6ece3]" />
              <div className="mt-4 h-8 w-full rounded bg-[#efe2d4]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

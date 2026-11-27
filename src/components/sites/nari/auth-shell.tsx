import type { ReactNode } from "react";
import Link from "next/link";
import { Award, ChevronRight, ShieldCheck, Truck } from "lucide-react";

interface AuthShellProps {
  breadcrumbLabel: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

const BRAND_BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Mỹ phẩm chính hãng 100%",
    description: "Nguồn gốc minh bạch, cam kết chất lượng chuẩn hãng cho từng sản phẩm.",
  },
  {
    icon: Truck,
    title: "Giao nhanh NariNow 2H",
    description: "Miễn phí vận chuyển cho đơn hàng từ 90.000 ₫ trên toàn hệ thống.",
  },
  {
    icon: Award,
    title: "Đặc quyền Nari Rewards",
    description: "Tích điểm thưởng, thăng hạng thành viên và theo dõi đơn hàng realtime.",
  },
] as const;

export function AuthShell({ breadcrumbLabel, title, subtitle, children }: AuthShellProps) {
  return (
    <main className="min-h-[72vh] bg-[#faf5f0] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl px-4">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[#6e5a4f]">
          <Link href="/" className="transition-colors hover:text-[#b86b4b]">
            Trang chủ
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#9e7656]" aria-hidden="true" />
          <span className="font-medium text-[#3d2e24]">{breadcrumbLabel}</span>
        </nav>

        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          <aside className="order-2 relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#9e7656]/30 bg-gradient-to-br from-[#3d2e24] via-[#2f231b] to-[#1e1b18] p-6 text-[#faf5f0] shadow-[0_14px_38px_rgba(30,27,24,0.18)] sm:p-8 lg:order-1 lg:col-span-5">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d8b89c]/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-[#b86b4b]/15 blur-3xl"
            />

            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8b89c]">
                NARI HOME · MỸ PHẨM CHÍNH HÃNG
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#faf5f0] sm:text-[34px]">
                Khơi nguồn vẻ đẹp, kiến tạo khí chất
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#e6d5c5]/85">
                Trải nghiệm mua sắm mỹ phẩm cao cấp chuẩn mực với giao nhận tốc hành và đặc quyền dành riêng cho thành viên Nari Home.
              </p>
            </div>

            <ul className="relative z-10 mt-8 space-y-4 border-t border-[#9e7656]/25 pt-6">
              {BRAND_BENEFITS.map(({ icon: Icon, title: itemTitle, description }) => (
                <li key={itemTitle} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8b89c]/25 bg-[#faf5f0]/10 text-[#d8b89c]">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#faf5f0]">{itemTitle}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#e6d5c5]/80">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <section className="order-1 rounded-2xl border border-[#e6d5c5] bg-white p-6 shadow-[0_12px_40px_rgba(61,46,36,0.08)] sm:p-8 lg:order-2 lg:col-span-7">
            {(title || subtitle) && (
              <div className="mb-6 border-b border-[#efe3d7] pb-5">
                {title && (
                  <h1 className="font-display text-2xl font-semibold tracking-tight text-[#3d2e24] sm:text-[30px]">
                    {title}
                  </h1>
                )}
                {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-[#6e5a4f]">{subtitle}</p>}
              </div>
            )}
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

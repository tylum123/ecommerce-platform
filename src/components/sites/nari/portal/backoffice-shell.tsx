"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ExternalLink,
  Headphones,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  Sparkles,
  Store,
  UserCog,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BackofficeNavItem {
  id: string;
  label: string;
  href?: string;
  onSelect?: () => void;
  icon:
    | "dashboard"
    | "orders"
    | "inventory"
    | "products"
    | "users"
    | "staff"
    | "mcp"
    | "store"
    | "warehouse"
    | "support"
    | "overview";
  badge?: string | number;
  active?: boolean;
}

export interface BackofficeNavGroup {
  title: string;
  items: BackofficeNavItem[];
}

function NavIcon({ name, active }: { name: BackofficeNavItem["icon"]; active?: boolean }) {
  const cls = cn("h-4 w-4 shrink-0", active ? "text-[#faf5f0]" : "text-[#9e7656]");
  switch (name) {
    case "orders":
      return <ShoppingBag className={cls} />;
    case "inventory":
    case "warehouse":
      return <Warehouse className={cls} />;
    case "products":
      return <Package className={cls} />;
    case "users":
      return <Users className={cls} />;
    case "staff":
      return <UserCog className={cls} />;
    case "mcp":
      return <Sparkles className={cls} />;
    case "store":
      return <Store className={cls} />;
    case "support":
      return <Headphones className={cls} />;
    case "overview":
      return <BriefcaseBusiness className={cls} />;
    default:
      return <LayoutDashboard className={cls} />;
  }
}

export function BackofficeShell({
  sectionLabel,
  userLabel,
  roleLabel,
  branchLabel,
  navGroups,
  topbarActions,
  children,
}: {
  sectionLabel: string;
  userLabel?: string;
  roleLabel?: string;
  branchLabel?: string;
  navGroups: BackofficeNavGroup[];
  topbarActions?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#3d2e24] via-[#2f231b] to-[#1e1b18] text-[#faf5f0]">
      {/* Brand header */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#b86b4b]/60 bg-[#2a1f18] font-display text-lg font-bold text-[#f6ece3]">
            N
          </span>
          <div className="min-w-0">
            <div className="font-display text-lg font-semibold leading-tight text-[#faf5f0]">
              Nari Home
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d8b89c]">
              {sectionLabel}
            </div>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setDrawerOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#e6d5c5] hover:bg-white/10 lg:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Điều hướng hệ thống nội bộ" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d8b89c]/75">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const itemCls = cn(
                  "flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition-colors",
                  item.active
                    ? "bg-[#b86b4b] text-[#faf5f0] shadow-sm"
                    : "text-[#e6d5c5]/90 hover:bg-white/10 hover:text-white",
                );

                const inner = (
                  <>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <NavIcon name={item.icon} active={item.active} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          item.active ? "bg-white/20 text-white" : "bg-white/10 text-[#d8b89c]",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                );

                if (item.onSelect) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={item.active ? "page" : undefined}
                      onClick={() => {
                        item.onSelect?.();
                        setDrawerOpen(false);
                      }}
                      className={itemCls}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href || "/"}
                    aria-current={item.active ? "page" : undefined}
                    onClick={() => setDrawerOpen(false)}
                    className={itemCls}
                  >
                    {inner}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer account & storefront link */}
      <div className="border-t border-white/10 p-4 text-xs">
        {(userLabel || roleLabel) && (
          <div className="mb-3 rounded-xl bg-white/5 px-3 py-2.5">
            {userLabel && <p className="truncate font-semibold text-[#faf5f0]">{userLabel}</p>}
            {roleLabel && <p className="mt-0.5 truncate text-[11px] text-[#d8b89c]">{roleLabel}</p>}
            {branchLabel && <p className="mt-0.5 truncate text-[11px] text-[#e6d5c5]/70">{branchLabel}</p>}
          </div>
        )}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#f6ece3] transition hover:bg-white/15"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Về cửa hàng trực tuyến</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf5f0] text-[#1e1b18] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-screen">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#1e1b18]/60 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 h-full w-72 max-w-[85vw] shadow-2xl">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#e6d5c5] bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu quản trị"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#e6d5c5] bg-[#faf5f0] text-[#3d2e24] hover:bg-[#f6ece3] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9e7656]">
                Nari Home · {sectionLabel}
              </p>
            </div>
          </div>
          {topbarActions && <div className="flex flex-wrap items-center gap-2">{topbarActions}</div>}
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

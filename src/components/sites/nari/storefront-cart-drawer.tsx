"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShoppingBag, ShoppingCart, Trash2, Truck, X } from "lucide-react";
import { money } from "@/lib/catalog";
import { CartDrawerItemsSkeleton } from "@/components/sites/nari/ui-skeletons";
import {
  handleSmoothImageError,
  handleSmoothImageLoad,
  syncCachedImageRef,
} from "@/lib/smooth-image";
import {
  FREE_SHIPPING_THRESHOLD,
  NARI_CART_DRAWER_OPEN_EVENT,
  NARI_CART_TOAST_EVENT,
  readCart,
  saveCart,
  type CartItem,
  type CartToastDetail,
} from "@/lib/cart";

interface DrawerProductSummary {
  slug: string;
  name: string;
  brand: string;
  price: number;
  image?: string;
}

let cachedProductsBySlug: Record<string, DrawerProductSummary> | null = null;
let inflightCatalogFetch: Promise<Record<string, DrawerProductSummary>> | null = null;

async function loadProductsBySlug(): Promise<Record<string, DrawerProductSummary>> {
  if (cachedProductsBySlug) return cachedProductsBySlug;
  if (inflightCatalogFetch) return inflightCatalogFetch;
  inflightCatalogFetch = fetch("/api/products?limit=200", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) return {};
      const payload: unknown = await response.json().catch(() => null);
      const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
      const data = record?.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : null;
      const items = Array.isArray(data?.items) ? data.items : [];
      const next: Record<string, DrawerProductSummary> = {};
      for (const raw of items) {
        if (!raw || typeof raw !== "object") continue;
        const item = raw as Record<string, unknown>;
        if (typeof item.slug !== "string" || typeof item.name !== "string") continue;
        next[item.slug] = {
          slug: item.slug,
          name: item.name,
          brand: typeof item.brand === "string" ? item.brand : "Nari Home",
          price: typeof item.price === "number" ? item.price : 0,
          image: typeof item.image === "string" ? item.image : undefined,
        };
      }
      cachedProductsBySlug = next;
      return next;
    })
    .catch(() => ({}))
    .finally(() => {
      inflightCatalogFetch = null;
    });
  return inflightCatalogFetch;
}

function fallbackProductLabel(slug: string): DrawerProductSummary {
  const clean = slug
    .replace(/\.html$/, "")
    .replace(/-[a-z0-9]+$/i, "")
    .replace(/-/g, " ")
    .trim();
  return {
    slug,
    name: clean || slug,
    brand: "Nari Home",
    price: 0,
  };
}

const subscribeCart = (callback: () => void) => {
  window.addEventListener("demo-cart-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-cart-change", callback);
    window.removeEventListener("storage", callback);
  };
};

const readCartSnapshot = () =>
  typeof window === "undefined" ? "[]" : localStorage.getItem("nari-cart") ?? "[]";

/** Global toast feedback and slide-over mini cart drawer with NariNow 2H freeship progress. */
export function StorefrontCartDrawer() {
  const [open, setOpen] = useState(false);
  const cartSnapshot = useSyncExternalStore(subscribeCart, readCartSnapshot, () => "[]");
  const items: CartItem[] = useMemo(
    () => (cartSnapshot === "[]" ? [] : readCart()),
    [cartSnapshot],
  );
  const [catalogMap, setCatalogMap] = useState<Record<string, DrawerProductSummary>>(
    () => cachedProductsBySlug ?? {},
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [toast, setToast] = useState<CartToastDetail | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureCatalogLoaded = useCallback(async () => {
    if (cachedProductsBySlug) {
      setCatalogMap(cachedProductsBySlug);
      return;
    }
    setLoadingCatalog(true);
    const map = await loadProductsBySlug();
    setCatalogMap(map);
    setLoadingCatalog(false);
  }, []);

  useEffect(() => {
    const handleOpenDrawer = () => {
      setOpen(true);
      void ensureCatalogLoaded();
    };
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<CartToastDetail>).detail;
      if (!detail?.slug) return;
      setToast(detail);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 3500);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener(NARI_CART_DRAWER_OPEN_EVENT, handleOpenDrawer);
    window.addEventListener(NARI_CART_TOAST_EVENT, handleToast);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener(NARI_CART_DRAWER_OPEN_EVENT, handleOpenDrawer);
      window.removeEventListener(NARI_CART_TOAST_EVENT, handleToast);
      window.removeEventListener("keydown", handleKeyDown);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [ensureCatalogLoaded]);

  const resolvedRows = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        product: catalogMap[item.slug] ?? fallbackProductLabel(item.slug),
      })),
    [items, catalogMap],
  );

  const totalCount = useMemo(
    () => resolvedRows.reduce((sum, row) => sum + row.quantity, 0),
    [resolvedRows],
  );
  const subtotal = useMemo(
    () => resolvedRows.reduce((sum, row) => sum + row.product.price * row.quantity, 0),
    [resolvedRows],
  );
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeshipPercent = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100),
  );

  const updateItemQuantity = (slug: string, nextQuantity: number) => {
    const next =
      nextQuantity < 1
        ? items.filter((entry) => entry.slug !== slug)
        : items.map((entry) =>
            entry.slug === slug ? { ...entry, quantity: nextQuantity } : entry,
          );
    saveCart(next);
  };

  return (
    <>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="nari-cart-toast"
          className="fixed bottom-16 right-4 z-[1400] flex max-w-sm items-start gap-3 rounded-xl border border-[#d4beaa] bg-[#3d2e24] p-3.5 text-[#faf5f0] shadow-xl sm:bottom-5"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#e2b08d]" />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-white">Đã thêm vào giỏ hàng</div>
            <p className="mt-0.5 line-clamp-2 text-[#f6ece3]">
              {toast.quantity} × {toast.name || catalogMap[toast.slug]?.name || toast.slug}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setToast(null);
                  setOpen(true);
                  void ensureCatalogLoaded();
                }}
                className="rounded bg-[#b86b4b] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#a2583a]"
              >
                Mở giỏ hàng
              </button>
              <Link
                href="/thanh-toan"
                onClick={() => setToast(null)}
                className="text-[11px] font-semibold text-[#efe2d4] underline hover:text-white"
              >
                Thanh toán ngay
              </Link>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng thông báo giỏ hàng"
            onClick={() => setToast(null)}
            className="rounded p-1 text-[#d4beaa] hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[1350] flex justify-end bg-black/45 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Giỏ hàng Nari Home"
            data-testid="nari-cart-drawer"
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-full max-w-md flex-col bg-[#faf5f0] text-[#1e1b18] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#e6d5c5] bg-[#f6ece3] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="h-5 w-5 text-[#3d2e24]" />
                <h2 className="text-lg font-bold text-[#1e1b18]">
                  Giỏ hàng ({totalCount})
                </h2>
              </div>
              <button
                type="button"
                aria-label="Đóng giỏ hàng"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-[#6e5a4f] hover:bg-[#ebd6c4] hover:text-[#1e1b18]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-[#e6d5c5] bg-white px-5 py-3">
              <div className="flex items-center gap-2 text-xs text-[#3d2e24]">
                <Truck className="h-4 w-4 shrink-0 text-[#b86b4b]" />
                {remainingForFreeShip === 0 && subtotal > 0 ? (
                  <span className="font-semibold">
                    Bạn đã đạt <strong>Miễn phí giao nhanh NariNow 2H</strong>
                  </span>
                ) : (
                  <span>
                    Mua thêm{" "}
                    <strong className="text-[#b86b4b]">
                      {money(subtotal === 0 ? FREE_SHIPPING_THRESHOLD : remainingForFreeShip)}
                    </strong>{" "}
                    để miễn phí giao nhanh NariNow 2H
                  </span>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#efe2d4]">
                <div
                  className="h-full rounded-full bg-[#b86b4b] transition-all duration-300"
                  style={{ width: `${freeshipPercent}%` }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loadingCatalog && resolvedRows.length > 0 && (
                <div className="mb-3">
                  <CartDrawerItemsSkeleton count={Math.min(3, resolvedRows.length)} />
                </div>
              )}

              {resolvedRows.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <ShoppingCart className="h-12 w-12 text-[#c8b6a6]" />
                  <p className="mt-3 text-sm font-medium text-[#6e5a4f]">
                    Giỏ hàng của bạn đang trống.
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-4 rounded-md bg-[#3d2e24] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#b86b4b]"
                  >
                    Tiếp tục khám phá sản phẩm
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {resolvedRows.map(({ slug, quantity, product }) => (
                    <li
                      key={slug}
                      className="flex gap-3 rounded-lg border border-[#ebd6c4] bg-white p-3"
                    >
                      <Link
                        href={`/san-pham/${slug}`}
                        onClick={() => setOpen(false)}
                        data-img-frame={product.image ? "true" : undefined}
                        className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-[#f0e4d7] bg-white p-1${product.image ? " nari-img-frame" : ""}`}
                      >
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={60}
                            height={60}
                            loading="lazy"
                            unoptimized
                            ref={syncCachedImageRef}
                            onLoad={handleSmoothImageLoad}
                            onError={handleSmoothImageError}
                            className="nari-smooth-img h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-[#9e8c80]">NARI</span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold uppercase text-[#9e7656]">
                          {product.brand}
                        </div>
                        <Link
                          href={`/san-pham/${slug}`}
                          onClick={() => setOpen(false)}
                          className="line-clamp-2 text-xs font-medium text-[#1e1b18] hover:text-[#b86b4b]"
                        >
                          {product.name}
                        </Link>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <strong className="text-sm text-[#b86b4b]">
                            {product.price > 0 ? money(product.price) : "Xem giá ở giỏ hàng"}
                          </strong>
                          <div className="flex items-center gap-1.5">
                            <div className="inline-flex items-center rounded border border-[#d4beaa] bg-[#faf5f0]">
                              <button
                                type="button"
                                aria-label={`Giảm số lượng ${product.name}`}
                                onClick={() => updateItemQuantity(slug, quantity - 1)}
                                className="px-2 py-0.5 text-xs font-bold text-[#3d2e24] hover:bg-[#efe2d4]"
                              >
                                −
                              </button>
                              <span className="min-w-[24px] bg-white px-1.5 py-0.5 text-center text-xs font-semibold">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Tăng số lượng ${product.name}`}
                                onClick={() => updateItemQuantity(slug, quantity + 1)}
                                className="px-2 py-0.5 text-xs font-bold text-[#3d2e24] hover:bg-[#efe2d4]"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              aria-label={`Xóa ${product.name}`}
                              onClick={() => updateItemQuantity(slug, 0)}
                              className="p-1 text-[#9e8c80] hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {resolvedRows.length > 0 && (
              <div className="border-t border-[#e6d5c5] bg-white px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6e5a4f]">Tạm tính</span>
                  <strong className="text-lg text-[#b86b4b]">{money(subtotal)}</strong>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Link
                    href="/gio-hang"
                    onClick={() => setOpen(false)}
                    className="rounded-md border border-[#3d2e24] bg-white px-4 py-2.5 text-center text-xs font-bold text-[#3d2e24] hover:bg-[#f6ece3]"
                  >
                    Xem giỏ hàng
                  </Link>
                  <Link
                    href="/thanh-toan"
                    onClick={() => setOpen(false)}
                    className="rounded-md bg-[#b86b4b] px-4 py-2.5 text-center text-xs font-bold text-white hover:bg-[#a2583a]"
                  >
                    Thanh toán ngay
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

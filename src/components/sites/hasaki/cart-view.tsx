"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ChevronLeft, ShieldCheck, Trash2 } from "lucide-react";
import { money, findCatalogProduct } from "@/lib/catalog";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import { readCart, saveCart } from "@/lib/cart";
import { getNewArrivals } from "@/lib/new-arrivals";
import { Footer } from "@/components/sites/hasaki/footer";
import { NariHomeLogo } from "@/components/sites/hasaki/nari-home-logo";

const subscribe = (callback: () => void) => {
  window.addEventListener("demo-cart-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-cart-change", callback);
    window.removeEventListener("storage", callback);
  };
};

const snapshot = () => localStorage.getItem("hasaki-demo-cart") ?? "[]";

export interface CartRowItem {
  slug: string;
  quantity: number;
  product: {
    slug: string;
    brand: string;
    name: string;
    price: number;
    image?: string;
  };
}

export function CartView({ checkout = false, liveCatalog }: { checkout?: boolean; liveCatalog?: LiveCatalogOverridesState }) {
  const cartSnapshot = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = cartSnapshot === "[]" ? [] : readCart();
  const [placed, setPlaced] = useState(false);

  // Resolve cart items across catalog (core, categories, deals, bestsellers, brands) and new arrivals
  const rows: CartRowItem[] = items.flatMap(item => {
    if (liveCatalog?.deletedSlugs.includes(item.slug)) return [];
    const catalogItem = findCatalogProduct(item.slug, liveCatalog);
    if (catalogItem) {
      return [
        {
          ...item,
          product: {
            slug: catalogItem.slug,
            brand: catalogItem.brand,
            name: catalogItem.name,
            price: catalogItem.price,
            image: catalogItem.image,
          },
        },
      ];
    }

    const observed = getNewArrivals(liveCatalog).find(p => p.slug === item.slug);
    if (observed) {
      return [
        {
          ...item,
          product: {
            slug: observed.slug,
            brand: observed.brand,
            name: observed.name,
            price: observed.numericPrice,
            image: observed.detail?.images[0] || observed.image,
          },
        },
      ];
    }

    // Graceful fallback for any other valid slug
    const cleanName = item.slug.replace(/\.html$/, "").replace(/-/g, " ");
    return [
      {
        ...item,
        product: {
          slug: item.slug,
          brand: "Nari Home",
          name: cleanName,
          price: 150000,
          image: undefined,
        },
      },
    ];
  });

  const total = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);

  const update = (slug: string, quantity: number) => {
    const next =
      quantity < 1
        ? items.filter(x => x.slug !== slug)
        : items.map(x => (x.slug === slug ? { ...x, quantity } : x));
    saveCart(next);
  };

  return (
    <>
      <div className="cart-top">
        <div className="wrap">
          <Link href="/" aria-label="Nari Home">
            <NariHomeLogo theme="light" compact={true} />
          </Link>
          <div>
            <ShoppingCart /> {checkout ? "THÔNG TIN ĐẶT HÀNG" : "GIỎ HÀNG"}
          </div>
          <Link href="/">Tiếp tục mua sắm</Link>
        </div>
      </div>

      <main className="wrap cart-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › <Link href="/gio-hang">Giỏ hàng</Link>
          {checkout && " › Thanh toán"}
        </div>

        {placed ? (
          <section className="cart-empty">
            <ShieldCheck size={45} />
            <h1>Đã hoàn tất giao diện đặt hàng mẫu</h1>
            <p>Không có đơn hàng hoặc thanh toán thật nào được tạo.</p>
            <Link href="/">Tiếp tục mua sắm</Link>
          </section>
        ) : (
          <>
            <h1>
              {checkout ? "Thông tin đặt hàng" : "Giỏ hàng của bạn"}{" "}
              <small>({rows.length} sản phẩm mẫu)</small>
            </h1>

            {!rows.length ? (
              <section className="cart-empty">
                <ShoppingCart size={52} />
                <p>Giỏ hàng của bạn đang trống</p>
                <Link href="/">TIẾP TỤC MUA SẮM</Link>
              </section>
            ) : (
              <div className="cart-layout">
                <div>
                  {checkout && (
                    <section className="cart-box checkout-form">
                      <h2>Thông tin nhận hàng</h2>
                      <label>
                        Họ và tên
                        <input placeholder="Nhập họ và tên" />
                      </label>
                      <label>
                        Số điện thoại
                        <input type="tel" placeholder="Nhập số điện thoại" />
                      </label>
                      <label>
                        Địa chỉ nhận hàng
                        <input placeholder="Nhập địa chỉ nhận hàng" />
                      </label>
                      <label>
                        Ghi chú
                        <textarea placeholder="Ghi chú cho đơn hàng" />
                      </label>
                      <h2>Phương thức thanh toán</h2>
                      <p>◉ Thanh toán khi nhận hàng (mẫu)</p>
                    </section>
                  )}

                  <section className="cart-box">
                    <div className="cart-box-heading">
                      <b>Sản phẩm</b>
                      <span>Đơn giá</span>
                      <span>Số lượng</span>
                      <span>Thành tiền</span>
                    </div>
                    {rows.map(({ product, quantity }) => (
                      <div className="cart-row" key={product.slug}>
                        <Link href={`/san-pham/${product.slug}`} className="cart-item">
                          <div className="cart-thumb">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                width={56}
                                height={56}
                                unoptimized
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                              />
                            ) : (
                              <span>ẢNH</span>
                            )}
                          </div>
                          <span>
                            <b>{product.brand}</b>
                            <br />
                            {product.name}
                          </span>
                        </Link>
                        <strong>{money(product.price)}</strong>
                        <div className="cart-quantity">
                          <button
                            type="button"
                            aria-label="Giảm số lượng"
                            onClick={() => update(product.slug, quantity - 1)}
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            aria-label="Tăng số lượng"
                            onClick={() => update(product.slug, quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                        <b>{money(product.price * quantity)}</b>
                        <button
                          type="button"
                          className="cart-delete"
                          aria-label="Xóa sản phẩm"
                          onClick={() => update(product.slug, 0)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </section>

                  <Link className="back-shopping" href="/">
                    <ChevronLeft size={16} /> Tiếp tục mua sắm
                  </Link>
                </div>

                <aside className="cart-box cart-summary">
                  <h2>Thông tin đơn hàng</h2>
                  <div>
                    <span>Tạm tính</span>
                    <b>{money(total)}</b>
                  </div>
                  <div>
                    <span>Phí vận chuyển</span>
                    <span>Miễn phí (NariNow 2H)</span>
                  </div>
                  <hr />
                  <div>
                    <strong>Tổng cộng</strong>
                    <strong>{money(total)}</strong>
                  </div>
                  <p>Giá và đơn hàng mô phỏng theo dữ liệu Nari Home.</p>
                  {checkout ? (
                    <button type="button" onClick={() => setPlaced(true)}>
                      HOÀN TẤT ĐẶT HÀNG MẪU
                    </button>
                  ) : (
                    <Link className="checkout-button" href="/thanh-toan">
                      TIẾN HÀNH ĐẶT HÀNG
                    </Link>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { ProductCard } from "@/components/sites/hasaki/product-card";
import Link from "next/link";
import { categories as categoryRoutes, products as productRoutes, categoryProducts, money, type Product } from "@/lib/catalog";
import { readCart } from "@/lib/cart";
import { ShoppingCart, UserRound, MapPin, ChevronLeft, ChevronRight, Gift, Heart, X } from "lucide-react";

const quick = ["Bán Chạy", "Sản Phẩm Cao Cấp", "Phụ Kiện Điện Thoại", "Thiết Bị Âm Thanh", "Vệ Sinh Nhà Cửa", "Balo & Túi Xách", "Sản Phẩm Cho Bé", "Đặt Hẹn"];
const quickDestinations = [
  "/san-pham-ban-chay.html?sort=topsale",
  "/tag/dai-tiec-hang-hieu.html",
  "/danh-muc/phu-kien-dien-thoai-c2474.html",
  "/danh-muc/thiet-bi-am-thanh-c2930.html",
  "/danh-muc/ve-sinh-nha-cua-c2462.html",
  "/danh-muc/balo-tui-xach-c2749.html",
  "/danh-muc/san-pham-cho-be-c2497.html",
  "/booking",
];
const best = ["Sữa Rửa Mặt", "Tẩy Trang Mặt", "Kem / Gel / Dầu Dưỡng", "Serum / Tinh Chất", "Mặt Nạ Giấy", "Toner / Nước Cân Bằng Da", "Bông Tẩy Trang", "Dầu Gội", "Bộ Gội Xả", "Son Kem / Tint"];
const brandItems: Array<[string, string]> = [
  ["L'ORÉAL", "l-oreal.html"],
  ["LA ROCHE-POSAY", "la-roche-posay.html"],
  ["COCOON", "cocoon.html"],
  ["VASELINE", "vaseline.html"],
  ["DOVE", "dove.html"],
  ["CERAVE", "cerave.html"],
  ["BIODERMA", "bioderma.html"],
  ["EUCERIN", "eucerin.html"],
  ["KLAIRS", "klairs.html"],
  ["SKIN1004", "skin1004.html"],
];
const suggestions = ["Gợi ý cho bạn", "Phụ Kiện Điện Thoại", "Thiết Bị Âm Thanh", "Vệ Sinh Nhà Cửa", "Sản Phẩm Cho Bé"];
const suggestionCategories = ["", "phu-kien-dien-thoai-c2474.html", "thiet-bi-am-thanh-c2930.html", "ve-sinh-nha-cua-c2462.html", "san-pham-cho-be-c2497.html"];
const topSearches: Array<[string, string]> = [
  ["Kem chống nắng", "/danh-muc/chong-nang-da-mat-c11.html"],
  ["Son dưỡng", "/danh-muc/son-kem-tint-c49.html"],
  ["Sữa Rửa Mặt", "/danh-muc/sua-rua-mat-c19.html"],
  ["Kem Dưỡng Da", "/danh-muc/kem-duong-dau-duong-c9.html"],
];
const clinicHighlights = [
  {
    name: "Trải Nghiệm Triệt Lông Nách Diode Laser (Nữ) 1 Lần",
    price: "49.000",
    slug: "triet-long-nach-1-buoi-nu-94461.html",
    image: "https://media.hcdn.vn/catalog/product/t/r/triet-long-nach-1-buoi-nu-94461_img_380x380_622873_fit_center.jpg",
  },
  {
    name: "Lấy Nhân Mụn Chuẩn Y Khoa Bằng Tăm Bông 1 Lần",
    price: "150.000",
    slug: "lay-nhan-mun-bang-tam-bong-69244.html",
    image: "https://media.hcdn.vn/catalog/product/l/a/lay-nhan-mun-bang-tam-bong-69244_img_380x380_622873_fit_center.jpg",
  },
  {
    name: "Aqua Mesoderm Điện Di Tinh Chất Trắng Sáng Da 1 Lần",
    price: "400.000",
    slug: "aqua-mesoderm-dien-di-tinh-chat-trang-sang-da-1-lan-86875.html",
    image: "https://media.hcdn.vn/catalog/product/a/q/aqua-mesoderm-dien-di-tinh-chat-trang-sang-da-1-lan-86875_img_380x380_622873_fit_center.jpg",
  },
  {
    name: "Peel Da Ngừa Mụn BHA Salicylic Acid 20% 1 Lần",
    price: "500.000",
    slug: "peel-bha-1-lan-101781.html",
    image: "https://media.hcdn.vn/catalog/product/p/e/peel-bha-1-lan-101781_img_380x380_622873_fit_center.jpg",
  },
];

export default function Home() {
  const [visibleCount, setVisibleCount] = useState(12);
  const [cart, setCart] = useState(0);
  const [panel, setPanel] = useState<"cart" | "account" | "location" | null>(null);
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState(0);
  const [clinic, setClinic] = useState(false);

  useEffect(() => {
    const refresh = () => setCart(readCart().reduce((sum, item) => sum + item.quantity, 0));
    refresh();
    window.addEventListener("demo-cart-change", refresh);
    return () => window.removeEventListener("demo-cart-change", refresh);
  }, []);

  const suggestionPool: Product[] =
    tab === 0
      ? [
          ...productRoutes,
          ...categoryProducts("cham-soc-da-mat-c4.html").slice(0, 6),
          ...categoryProducts("chong-nang-da-mat-c11.html").slice(0, 6),
        ]
      : categoryProducts(suggestionCategories[tab]);

  const uniqueSuggestions = Array.from(new Map(suggestionPool.map((item) => [item.slug, item])).values());

  const cards = (items: readonly Product[], compact = false) =>
    items.map((product) =>
      compact ? (
        <article className="product" key={product.slug}>
          <Link href={`/san-pham/${product.slug}`}>
            <div className="product-picture">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={180}
                  height={180}
                  unoptimized
                  style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff", padding: 6 }}
                />
              ) : (
                <>
                  <span>ẢNH SẢN PHẨM</span>
                  <b>{product.brand}</b>
                </>
              )}
            </div>
            <div className="product-content">
              <div className="price-row" style={{ justifyContent: "space-between" }}>
                <strong>{money(product.price)}</strong>
                {product.sale > 0 && <span>-{product.sale}%</span>}
              </div>
              {product.old > product.price && <del>{money(product.old)}</del>}
              <small>{product.brand}</small>
              <p>{product.name}</p>
              <div className="progress">
                <i style={{ width: `${Math.min(100, Math.max(20, product.sold ?? 65))}%` }} />
                <span>Đã bán {Math.min(100, Math.max(20, product.sold ?? 65))}%</span>
              </div>
            </div>
          </Link>
        </article>
      ) : (
        <ProductCard key={product.slug} product={product} />
      )
    );

  return (
    <>
      <Header />
      <main className="wrap">
        <div className="hero-layout">
          <div className={`hero hero-${slide % 4}`}>
            <div>
              <small>HASAKI DEALS</small>
              <h1>{["SIÊU SALE LIÊN HOÀN", "GIỜ VÀNG SĂN SALE", "MỖI NGÀY THÊM XINH", "ƯU ĐÃI LÀM ĐẸP"][slide % 4]}</h1>
              <p>Khám phá ưu đãi dành riêng cho bạn</p>
              <a href="#flash">KHÁM PHÁ NGAY →</a>
            </div>
            <button className="hero-prev" onClick={() => setSlide((slide + 7) % 8)} aria-label="Banner trước">
              <ChevronLeft />
            </button>
            <button className="hero-next" onClick={() => setSlide((slide + 1) % 8)} aria-label="Banner tiếp theo">
              <ChevronRight />
            </button>
            <div className="dots">
              {Array.from({ length: 8 }, (_, i) => (
                <button key={i} aria-label={`Banner ${i + 1}`} className={i === slide ? "active" : ""} onClick={() => setSlide(i)} />
              ))}
            </div>
          </div>
          <div className="hero-side">
            <Link href="/danh-muc/nha-cua-doi-song-c2529.html">
              <small>KHÁM PHÁ NGAY</small>
              <b>
                NHÀ CỬA
                <br />
                &amp; ĐỜI SỐNG
              </b>
            </Link>
            <Link href="/danh-muc/dien-gia-dung-c2463.html">
              <small>KHÁM PHÁ NGAY</small>
              <b>
                ĐIỆN
                <br />
                GIA DỤNG
              </b>
            </Link>
          </div>
        </div>

        <div className="quick-links">
          {quick.map((q, i) => (
            <Link href={quickDestinations[i]} key={q}>
              <span className={`quick-icon q${i}`}>{["✦", "♛", "▣", "♫", "✿", "▤", "♡", "▦"][i]}</span>
              {q}
            </Link>
          ))}
        </div>

        <section className="flash section" id="flash">
          <div className="section-title">
            <div>
              <h2>Flash deals</h2>
              <span className="timer">02 : 00 : 00</span>
            </div>
            <Link href="/deals-dang-dien-ra.html?product_list_order=topsale">Xem tất cả ›</Link>
          </div>
          <div className="flash-scroll">{cards(productRoutes, true)}</div>
        </section>

        <div className="brand-banners">
          <Link href="/campaign/wow" style={{ display: "grid", placeItems: "center", background: "#e1eadf", minHeight: 115, fontWeight: "bold", color: "#6b8b73" }}>
            ƯU ĐÃI THƯƠNG HIỆU WOW
          </Link>
          <Link href="/tag/dai-tiec-hang-hieu.html" style={{ display: "grid", placeItems: "center", background: "#f4e8c8", minHeight: 115, fontWeight: "bold", color: "#ad8b4d" }}>
            ĐẠI TIỆC HÀNG HIỆU
          </Link>
          <Link href="/san-pham-ban-chay.html" style={{ display: "grid", placeItems: "center", background: "#e9e0eb", minHeight: 115, fontWeight: "bold", color: "#927998" }}>
            TOP SẢN PHẨM BÁN CHẠY
          </Link>
        </div>

        <section className="section" id="categories">
          <div className="section-title">
            <h2>Danh mục</h2>
          </div>
          <div className="categories">
            {categoryRoutes.slice(0, 18).map(([c, slug], i) => {
              const catThumb = categoryProducts(slug).find((p) => p.image)?.image;
              return (
                <Link href={`/danh-muc/${slug}`} key={c}>
                  {catThumb ? (
                    <Image
                      src={catThumb}
                      alt={c}
                      width={72}
                      height={72}
                      unoptimized
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        objectFit: "contain",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        padding: 6,
                      }}
                    />
                  ) : (
                    <span className={`cat-placeholder q${i % 8}`} style={{ fontSize: 18, fontWeight: 700 }}>
                      {c.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>{c}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section" id="brands">
          <div className="section-title">
            <h2>Thương hiệu</h2>
            <Link href="/thuong-hieu">Xem tất cả ›</Link>
          </div>
          <div className="brand-hero">
            {(
              [
                ["VICHY", "vichy.html"],
                ["CERAVE", "cerave.html"],
                ["LA ROCHE-POSAY", "la-roche-posay.html"],
              ] as const
            ).map(([b, slug]) => (
              <Link href={`/thuong-hieu/${slug}`} key={b} style={{ height: 115, background: "#e4eee5", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#47745a", fontSize: 24, fontWeight: "bold" }}>
                {b}
                <small style={{ fontSize: 10, marginTop: 8 }}>KHÁM PHÁ THƯƠNG HIỆU</small>
              </Link>
            ))}
          </div>
          <div className="brand-logos">
            {brandItems.map(([b, slug]) => (
              <Link href={`/thuong-hieu/${slug}`} key={b} style={{ border: "1px solid #eee", height: 60, display: "grid", placeItems: "center", textAlign: "center", fontSize: 10, fontWeight: "bold", color: "#536b60" }}>
                {b}
              </Link>
            ))}
          </div>
        </section>

        <section className="section" id="best">
          <div className="section-title">
            <h2>Bán chạy</h2>
            <Link href="/san-pham-ban-chay.html">Xem tất cả ›</Link>
          </div>
          <div className="best-grid">
            {best.map((b, i) => {
              const slug = categoryRoutes.find((x) => x[0] === b)?.[1] ?? "cham-soc-da-mat-c4.html";
              const bestThumb = categoryProducts(slug).find((p) => p.image)?.image;
              return (
                <Link href={`/danh-muc/${slug}`} key={b}>
                  {bestThumb ? (
                    <Image
                      src={bestThumb}
                      alt={b}
                      width={70}
                      height={70}
                      unoptimized
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        objectFit: "contain",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        padding: 6,
                      }}
                    />
                  ) : (
                    <span className={`cat-placeholder q${i % 8}`} style={{ fontSize: 18, fontWeight: 700 }}>
                      {b.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <small>{(8.4 - i * 0.7).toFixed(1)}M đã bán</small>
                  <b>{b}</b>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-title">
            <h2>Top tìm kiếm</h2>
          </div>
          <div className="top-search">
            {topSearches.map(([label, href], i) => (
              <Link key={label} href={href} className={`q${i}`}>
                <b>{label}</b>
                <span>Khám phá sản phẩm →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" id="clinic">
          <div className="section-title clinic-tabs">
            <div>
              <button className={!clinic ? "selected" : ""} onClick={() => setClinic(false)}>
                Hasaki Clinic
              </button>
              <button className={clinic ? "selected" : ""} onClick={() => setClinic(true)}>
                Bảng giá
              </button>
            </div>
            <Link href={clinic ? "/bang-gia-dich-vu.html" : "/clinic"}>Xem tất cả ›</Link>
          </div>
          {clinic ? (
            <div className="clinic-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <strong>Bảng giá dịch vụ Hasaki Clinic chuẩn Y Khoa</strong>
                <p style={{ margin: "6px 0 0" }}>Khám da miễn phí 100% với Bác sĩ Da liễu · Cam kết hiệu quả &amp; minh bạch chi phí.</p>
              </div>
              <Link href="/bang-gia-dich-vu.html" style={{ background: "#326e51", color: "#fff", padding: "10px 18px", borderRadius: 4, fontWeight: 700 }}>
                Xem bảng giá chi tiết →
              </Link>
            </div>
          ) : (
            <div className="clinic-grid">
              {clinicHighlights.map((item, i) => (
                <article key={item.slug}>
                  <Link href={`/dich-vu/${item.slug}`}>
                    <div className={`clinic-image q${i}`} style={{ position: "relative", overflow: "hidden" }}>
                      <Image src={item.image} alt={item.name} width={300} height={150} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <b>{item.price} ₫</b>
                    <p>{item.name}</p>
                    <span>★ 5.0　 |　Đặt hẹn ngay</span>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section" id="suggestions">
          <div className="suggestion-tabs">
            {suggestions.map((s, i) => (
              <button
                onClick={() => {
                  setTab(i);
                  setVisibleCount(12);
                }}
                className={i === tab ? "selected" : ""}
                key={s}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="product-grid">{uniqueSuggestions.length ? cards(uniqueSuggestions.slice(0, visibleCount)) : <p>Chưa có sản phẩm trong mục này.</p>}</div>
          {uniqueSuggestions.length > visibleCount && (
            <button className="more" onClick={() => setVisibleCount((count) => count + 6)}>
              Xem thêm
            </button>
          )}
        </section>
      </main>
      <Footer />
      {panel && (
        <div className="modal-bg" onClick={() => setPanel(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button className="close" aria-label="Đóng" onClick={() => setPanel(null)}>
              <X />
            </button>
            {panel === "cart" ? (
              <>
                <h2>Giỏ hàng của bạn</h2>
                <ShoppingCart size={42} />
                <p>{cart ? `Bạn đã thêm ${cart} sản phẩm.` : "Chưa có sản phẩm trong giỏ hàng."}</p>
                <Link className="checkout-button" href="/gio-hang">
                  Xem giỏ hàng
                </Link>
              </>
            ) : panel === "account" ? (
              <>
                <h2>Đăng nhập / Đăng ký</h2>
                <UserRound size={42} />
                <p>Truy cập cổng khách hàng hoặc quản trị hệ thống.</p>
              </>
            ) : (
              <>
                <h2>Chọn khu vực của bạn</h2>
                <MapPin size={42} />
                <p>Chọn Tỉnh/Thành phố và Quận/Huyện để xem tồn kho 2H.</p>
              </>
            )}
          </div>
        </div>
      )}
      <div className="floating">
        <button onClick={() => window.dispatchEvent(new Event("hasaki-open-account"))} aria-label="Tài khoản">
          <Heart size={18} />
        </button>
        <a href="#flash" aria-label="Khuyến mãi">
          <Gift size={18} />
        </a>
      </div>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { ProductCard } from "@/components/sites/nari/product-card";
import Link from "next/link";
import { categories as snapshotCategoryRoutes, getFeaturedProducts, categoryProducts as snapshotCategoryProducts, money, type Product } from "@/lib/catalog";
import { readCart } from "@/lib/cart";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import {
  handleSmoothImageError,
  handleSmoothImageLoad,
  syncCachedImageRef,
} from "@/lib/smooth-image";
import {
  ShoppingCart,
  UserRound,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Gift,
  Heart,
  X,
  TrendingUp,
  Crown,
  Smartphone,
  Headphones,
  Home as HomeIcon,
  ShoppingBag,
  ArrowUp,
} from "lucide-react";

const quick = ["Bán Chạy", "Sản Phẩm Cao Cấp", "Phụ Kiện Điện Thoại", "Thiết Bị Âm Thanh", "Vệ Sinh Nhà Cửa", "Balo & Túi Xách", "Sản Phẩm Cho Bé", "Ưu Đãi"];
const quickIcons = [
  <TrendingUp key="0" size={24} />,
  <Crown key="1" size={24} />,
  <Smartphone key="2" size={24} />,
  <Headphones key="3" size={24} />,
  <HomeIcon key="4" size={24} />,
  <ShoppingBag key="5" size={24} />,
  <Heart key="6" size={24} />,
  <Gift key="7" size={24} />,
];
const quickDestinations = [
  "/san-pham-ban-chay.html?sort=topsale",
  "/tag/dai-tiec-hang-hieu.html",
  "/danh-muc/phu-kien-dien-thoai-c2474.html",
  "/danh-muc/thiet-bi-am-thanh-c2930.html",
  "/danh-muc/ve-sinh-nha-cua-c2462.html",
  "/danh-muc/balo-tui-xach-c2749.html",
  "/danh-muc/san-pham-cho-be-c2497.html",
  "/deals-dang-dien-ra.html",
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

const defaultHeroSlides = [
  {
    type: "image" as const,
    src: "/nari-home-banner.jpg",
    alt: "Nari Home — Khơi nguồn vẻ đẹp - Kiến tạo khí chất",
    href: "/deals-dang-dien-ra.html",
  },
  {
    type: "editorial" as const,
    badge: "NARI DEALS",
    title: "SIÊU SALE LIÊN HOÀN",
    subtitle: "Khơi nguồn vẻ đẹp - Kiến tạo khí chất",
    href: "#flash",
    themeClass: "hero-1",
  },
  {
    type: "editorial" as const,
    badge: "HOT DEALS",
    title: "MỖI NGÀY THÊM XINH",
    subtitle: "Mỹ phẩm chính hãng 100% — Giao nhanh NariNow 2H",
    href: "/campaign/wow",
    themeClass: "hero-3",
  },
];

export function HomeView({ liveCatalog }: { liveCatalog: LiveCatalogOverridesState }) {
  const isPostgres = liveCatalog.source === "postgres";
  const categoryRoutes: ReadonlyArray<readonly [string, string]> = isPostgres ? (liveCatalog.references?.categories || []).map(item => [item.label, item.slug]) : snapshotCategoryRoutes;
  const visibleBrands: ReadonlyArray<readonly [string, string]> = isPostgres ? (liveCatalog.references?.brands || []).map(item => [item.label, item.slug]) : brandItems;
  const productRoutes = getFeaturedProducts(liveCatalog);
  const categoryProducts = (slug: string) => snapshotCategoryProducts(slug, liveCatalog);
  const hasSideBanners = liveCatalog.banners.sideBanners.length > 0 || !isPostgres;
  const heroSlides: typeof defaultHeroSlides = liveCatalog.banners.heroSlides.length > 0
    ? liveCatalog.banners.heroSlides.map((item) => ({ ...item, type: "image" as const }))
    : isPostgres ? [] : defaultHeroSlides;
  const [visibleCount, setVisibleCount] = useState(12);
  const [cart, setCart] = useState(0);
  const [panel, setPanel] = useState<"cart" | "account" | "location" | null>(null);
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const refresh = () => setCart(readCart().reduce((sum, item) => sum + item.quantity, 0));
    refresh();
    window.addEventListener("demo-cart-change", refresh);
    return () => window.removeEventListener("demo-cart-change", refresh);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeSuggestions = isPostgres
    ? ["Tất cả sản phẩm", ...categoryRoutes.map(([label]) => label)]
    : suggestions;
  const activeSuggestionCategories = isPostgres
    ? ["", ...categoryRoutes.map(([, catSlug]) => catSlug)]
    : suggestionCategories;
  const safeTab = tab < activeSuggestions.length ? tab : 0;

  const suggestionPool: Product[] =
    safeTab === 0
      ? isPostgres
        ? [...productRoutes]
        : [
            ...productRoutes,
            ...categoryProducts("cham-soc-da-mat-c4.html").slice(0, 6),
            ...categoryProducts("chong-nang-da-mat-c11.html").slice(0, 6),
          ]
      : categoryProducts(activeSuggestionCategories[safeTab]);

  const uniqueSuggestions = Array.from(new Map(suggestionPool.map((item) => [item.slug, item])).values());

  const pgQuickLinks = [
    ...categoryRoutes.slice(0, 2).map(([label, catSlug], idx) => ({
      label,
      href: `/danh-muc/${catSlug}`,
      qClass: `q${idx % 8}`,
      icon: quickIcons[idx % 2],
    })),
    { label: "Thương Hiệu", href: "/thuong-hieu", qClass: "q2", icon: <Crown key="pg-brand" size={24} /> },
    { label: "Cửa Hàng", href: "/he-thong-cua-hang", qClass: "q3", icon: <MapPin key="pg-store" size={24} /> },
    { label: "Tra Cứu Đơn", href: "/tra-cuu-don-hang", qClass: "q4", icon: <TrendingUp key="pg-lookup" size={24} /> },
    { label: "Giỏ Hàng", href: "/gio-hang", qClass: "q5", icon: <ShoppingCart key="pg-cart" size={24} /> },
    { label: "Hỗ Trợ", href: "/ho-tro", qClass: "q6", icon: <Headphones key="pg-support" size={24} /> },
    { label: "Ưu Đãi", href: "/deals-dang-dien-ra.html", qClass: "q7", icon: <Gift key="pg-deals" size={24} /> },
  ];

  const visibleTopSearches: ReadonlyArray<readonly [string, string]> = isPostgres
    ? [
        ...categoryRoutes.slice(0, 2).map(([label, catSlug]) => [label, `/danh-muc/${catSlug}`] as const),
        ["Thương hiệu Nari Home", "/thuong-hieu"] as const,
        ["Tất cả sản phẩm", "/tim-kiem"] as const,
      ]
    : topSearches;

  const cards = (items: readonly Product[], compact = false) =>
    items.map((product) =>
      compact ? (
        <article className="product" key={product.slug}>
          <Link href={`/san-pham/${product.slug}`}>
            <div
              className={product.image ? "product-picture nari-img-frame" : "product-picture"}
              data-img-frame={product.image ? "true" : undefined}
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  width={180}
                  height={180}
                  loading="lazy"
                  unoptimized
                  className="nari-smooth-img"
                  ref={syncCachedImageRef}
                  onLoad={handleSmoothImageLoad}
                  onError={handleSmoothImageError}
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
              {liveCatalog.source !== "postgres" && <div className="progress">
                <i style={{ width: `${Math.min(100, Math.max(20, product.sold ?? 65))}%` }} />
                <span>Đã bán {Math.min(100, Math.max(20, product.sold ?? 65))}%</span>
              </div>}
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
        <div className={hasSideBanners ? "hero-layout" : "hero-layout hero-layout--single"}>
          {(() => {
            const currentSlide = heroSlides[slide % heroSlides.length];
            if (!currentSlide) return <div className="hero"><p>Chưa có banner.</p></div>;
            if (currentSlide.type === "image") {
              return (
                <div className="hero relative overflow-hidden" style={{ padding: 0 }}>
                  <Link href={currentSlide.href} className="relative block w-full h-full">
                    <Image
                      src={currentSlide.src}
                      alt={currentSlide.alt}
                      fill
                      priority
                      unoptimized
                      className="object-cover object-center"
                      sizes={hasSideBanners ? "(max-width: 1000px) 100vw, 920px" : "(max-width: 1000px) 100vw, 1340px"}
                    />
                  </Link>
                  {heroSlides.length > 1 && (
                    <>
                      <button
                        className="hero-prev"
                        style={{ zIndex: 10 }}
                        onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)}
                        aria-label="Banner trước"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        className="hero-next"
                        style={{ zIndex: 10 }}
                        onClick={() => setSlide((slide + 1) % heroSlides.length)}
                        aria-label="Banner tiếp theo"
                      >
                        <ChevronRight />
                      </button>
                      <div className="dots" style={{ zIndex: 10 }}>
                        {heroSlides.map((_, i) => (
                          <button
                            key={i}
                            aria-label={`Banner ${i + 1}`}
                            className={i === (slide % heroSlides.length) ? "active" : ""}
                            onClick={() => setSlide(i)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            }
            return (
              <div className={`hero ${currentSlide.themeClass}`}>
                <div>
                  <small>{currentSlide.badge}</small>
                  <h1>{currentSlide.title}</h1>
                  <p>{currentSlide.subtitle}</p>
                  <a href={currentSlide.href}>KHÁM PHÁ NGAY →</a>
                </div>
                {heroSlides.length > 1 && (
                  <>
                    <button
                      className="hero-prev"
                      style={{ zIndex: 10 }}
                      onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)}
                      aria-label="Banner trước"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      className="hero-next"
                      style={{ zIndex: 10 }}
                      onClick={() => setSlide((slide + 1) % heroSlides.length)}
                      aria-label="Banner tiếp theo"
                    >
                      <ChevronRight />
                    </button>
                    <div className="dots" style={{ zIndex: 10 }}>
                      {heroSlides.map((_, i) => (
                        <button
                          key={i}
                          aria-label={`Banner ${i + 1}`}
                          className={i === (slide % heroSlides.length) ? "active" : ""}
                          onClick={() => setSlide(i)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
          {hasSideBanners && (
            <div className="hero-side">
              {liveCatalog.banners.sideBanners.length > 0 ? liveCatalog.banners.sideBanners.map((banner) => (
                <Link href={banner.href} key={banner.id} style={{ padding: 0, overflow: "hidden" }}>
                  <Image
                    src={banner.src}
                    alt={banner.alt}
                    width={320}
                    height={140}
                    loading="lazy"
                    unoptimized
                    className="nari-smooth-img"
                    ref={syncCachedImageRef}
                    onLoad={handleSmoothImageLoad}
                    onError={handleSmoothImageError}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Link>
              )) : !isPostgres ? <>
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
              </> : null}
            </div>
          )}
        </div>

        <div className="quick-links">
          {isPostgres
            ? pgQuickLinks.map((item) => (
                <Link href={item.href} key={item.label}>
                  <span className={`quick-icon ${item.qClass}`}>{item.icon}</span>
                  {item.label}
                </Link>
              ))
            : quick.map((q, i) => (
                <Link href={quickDestinations[i]} key={q}>
                  <span className={`quick-icon q${i}`}>{quickIcons[i]}</span>
                  {q}
                </Link>
              ))}
        </div>

        <section className="flash section" id="flash">
          <div className="section-title">
            <div>
              <h2>{isPostgres && productRoutes.length > 0 ? "Sản phẩm nổi bật Nari Home" : "Flash deals"}</h2>
              {!isPostgres && <span className="timer">02 : 00 : 00</span>}
            </div>
            <Link href={isPostgres && productRoutes.length > 0 ? "/tim-kiem" : "/deals-dang-dien-ra.html?product_list_order=topsale"}>
              Xem tất cả ›
            </Link>
          </div>
          {isPostgres ? (
            productRoutes.length > 0 ? (
              <div className="product-grid">{cards(productRoutes)}</div>
            ) : (
              <div className="flash-scroll">
                <p>Chưa có dữ liệu Flash deals.</p>
              </div>
            )
          ) : (
            <div className="flash-scroll">{cards(productRoutes, true)}</div>
          )}
        </section>

        <div className="brand-banners">
          <Link href="/campaign/wow" style={{ display: "grid", placeItems: "center", background: "#f6ece3", minHeight: 115, fontWeight: "bold", color: "#3d2e24", border: "1px solid #ebd6c4", borderRadius: 6 }}>
            ƯU ĐÃI THƯƠNG HIỆU WOW
          </Link>
          <Link href="/tag/dai-tiec-hang-hieu.html" style={{ display: "grid", placeItems: "center", background: "#faeadb", minHeight: 115, fontWeight: "bold", color: "#703c27", border: "1px solid #ebd6c4", borderRadius: 6 }}>
            ĐẠI TIỆC HÀNG HIỆU
          </Link>
          <Link href="/san-pham-ban-chay.html" style={{ display: "grid", placeItems: "center", background: "#f5ebe3", minHeight: 115, fontWeight: "bold", color: "#3d2e24", border: "1px solid #ebd6c4", borderRadius: 6 }}>
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
                      loading="lazy"
                      unoptimized
                      className="nari-smooth-img"
                      ref={syncCachedImageRef}
                      onLoad={handleSmoothImageLoad}
                      onError={handleSmoothImageError}
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
          <div className={isPostgres ? "brand-hero brand-hero--postgres" : "brand-hero"}>
            {isPostgres
              ? visibleBrands.slice(0, 3).map(([b, slug], idx) => {
                  const palettes = [
                    ["#f6ece3", "#3d2e24"],
                    ["#faeadb", "#703c27"],
                    ["#f5ebe3", "#3d2e24"],
                  ] as const;
                  const [bg, textCol] = palettes[idx % palettes.length];
                  return (
                    <Link href={`/thuong-hieu/${slug}`} key={b} style={{ height: 115, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: textCol, fontSize: 22, fontWeight: "bold", border: "1px solid #ebd6c4", borderRadius: 6 }}>
                      {b}
                      <small style={{ fontSize: 10, marginTop: 8, color: "#9e7656" }}>KHÁM PHÁ THƯƠNG HIỆU</small>
                    </Link>
                  );
                })
              : (
                  [
                    ["VICHY", "vichy.html", "#f6ece3", "#3d2e24"],
                    ["CERAVE", "cerave.html", "#faeadb", "#703c27"],
                    ["LA ROCHE-POSAY", "la-roche-posay.html", "#f5ebe3", "#3d2e24"],
                  ] as const
                ).map(([b, slug, bg, textCol]) => (
                  <Link href={`/thuong-hieu/${slug}`} key={b} style={{ height: 115, background: bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: textCol, fontSize: 24, fontWeight: "bold", border: "1px solid #ebd6c4", borderRadius: 6 }}>
                    {b}
                    <small style={{ fontSize: 10, marginTop: 8, color: "#9e7656" }}>KHÁM PHÁ THƯƠNG HIỆU</small>
                  </Link>
                ))}
          </div>
          {(!isPostgres || visibleBrands.length > 3) && (
            <div className="brand-logos">
              {visibleBrands.map(([b, slug]) => (
                <Link href={`/thuong-hieu/${slug}`} key={b} style={{ border: "1px solid #ebd6c4", background: "#ffffff", height: 60, display: "grid", placeItems: "center", textAlign: "center", fontSize: 10, fontWeight: "bold", color: "#3d2e24", borderRadius: 4 }}>
                  {b}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="section" id="best">
          <div className="section-title">
            <h2>{isPostgres ? "Danh mục nổi bật" : "Bán chạy"}</h2>
            <Link href={isPostgres ? "/tim-kiem" : "/san-pham-ban-chay.html"}>Xem tất cả ›</Link>
          </div>
          <div className="best-grid">
            {(isPostgres ? categoryRoutes.map(([label]) => label) : best).map((b, i) => {
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
                      loading="lazy"
                      unoptimized
                      className="nari-smooth-img"
                      ref={syncCachedImageRef}
                      onLoad={handleSmoothImageLoad}
                      onError={handleSmoothImageError}
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
                  {!isPostgres && <small>{(8.4 - i * 0.7).toFixed(1)}M đã bán</small>}
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
            {visibleTopSearches.map(([label, href], i) => (
              <Link key={label} href={href} className={`q${i}`}>
                <b>{label}</b>
                <span>Khám phá sản phẩm →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="section" id="suggestions">
          <div className="suggestion-tabs">
            {activeSuggestions.map((s, i) => (
              <button
                onClick={() => {
                  setTab(i);
                  setVisibleCount(12);
                }}
                className={i === safeTab ? "selected" : ""}
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
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp size={18} />
          </button>
        )}
        <button onClick={() => window.dispatchEvent(new Event("nari-open-account"))} aria-label="Tài khoản">
          <Heart size={18} />
        </button>
        <a href="#flash" aria-label="Khuyến mãi">
          <Gift size={18} />
        </a>
      </div>
    </>
  );
}

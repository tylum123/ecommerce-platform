"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { getAllCatalogProducts, categories, money } from "@/lib/catalog";
import { newArrivals } from "@/lib/new-arrivals";
import { addToCart } from "@/lib/cart";
import { ShoppingCart, Check } from "lucide-react";

export interface SearchCatalogItem {
  slug: string;
  name: string;
  brand: string;
  category: string;
  categoryName: string;
  price: number;
  old: number;
  sale: number;
  image?: string;
  description: string;
  sold?: number;
  rating?: number;
}

const normalise = (text: string) =>
  text
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

const categoryNameMap = new Map<string, string>(categories.map(([name, slug]) => [slug, name]));

function buildSearchCatalog(): SearchCatalogItem[] {
  const map = new Map<string, SearchCatalogItem>();

  // 1. All products from catalog (core, categories, deals, bestsellers, featured brands)
  for (const item of getAllCatalogProducts()) {
    const catName = categoryNameMap.get(item.category) || item.category || "Chăm sóc da & Làm đẹp";
    const discount =
      item.sale ||
      (item.old > item.price ? Math.round(((item.old - item.price) / item.old) * 100) : 0);

    map.set(item.slug, {
      slug: item.slug,
      name: item.name,
      brand: item.brand || "Nari Home",
      category: item.category || "",
      categoryName: catName,
      price: item.price,
      old: item.old || item.price,
      sale: discount,
      image: item.image,
      description: item.description || "",
      sold: item.sold,
      rating: item.rating,
    });
  }

  // 2. New arrivals snapshot
  for (const item of newArrivals) {
    if (!map.has(item.slug)) {
      const discount =
        item.numericOld > item.numericPrice
          ? Math.round(((item.numericOld - item.numericPrice) / item.numericOld) * 100)
          : 0;

      map.set(item.slug, {
        slug: item.slug,
        name: item.name,
        brand: item.brand || "Nari Home",
        category: "hang-moi-ve",
        categoryName: "Hàng Mới Về",
        price: item.numericPrice,
        old: item.numericOld || item.numericPrice,
        sale: discount,
        image: item.detail?.images[0] || item.image,
        description: item.description || "",
      });
    }
  }

  return Array.from(map.values());
}

const sorts = [
  ["position", "Mới nhất"],
  ["topsale", "Bán chạy"],
  ["price_asc", "Giá thấp đến cao"],
  ["price_desc", "Giá cao đến thấp"],
] as const;

export function SearchView({ query, sort }: { query: string; sort: string }) {
  const [brand, setBrand] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [range, setRange] = useState<[number, number]>([0, Infinity]);
  const [error, setError] = useState("");
  const [addedSlugs, setAddedSlugs] = useState<Record<string, boolean>>({});

  const catalog = buildSearchCatalog();
  const terms = normalise(query.trim()).split(/\s+/).filter(Boolean);

  const matches = terms.length
    ? catalog.filter(item => {
        const text = normalise(
          `${item.name} ${item.brand} ${item.categoryName} ${item.description}`
        );
        return terms.every(term => text.includes(term));
      })
    : [];

  const brands = Array.from(new Set(matches.map(item => item.brand).filter(Boolean)));
  const categoriesInMatches = Array.from(
    new Set(matches.map(item => item.categoryName).filter(Boolean))
  );

  const items = matches
    .filter(item => {
      if (brand && item.brand !== brand) return false;
      if (selectedCategory && item.categoryName !== selectedCategory) return false;
      if (onSaleOnly && !(item.sale > 0 || item.old > item.price)) return false;
      if (item.price < range[0] || item.price > range[1]) return false;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "topsale") return (b.sold || 0) - (a.sold || 0);
      return 0;
    });

  function applyPrice() {
    const low = min ? Number(min) : 0;
    const high = max ? Number(max) : Infinity;
    if (!Number.isFinite(low) || low < 0 || Number.isNaN(high) || high < low) {
      setError("Vui lòng nhập khoảng giá hợp lệ.");
      return;
    }
    setError("");
    setRange([low, high]);
  }

  const handleAddToCart = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(slug, 1);
    setAddedSlugs(prev => ({ ...prev, [slug]: true }));
    setTimeout(() => {
      setAddedSlugs(prev => ({ ...prev, [slug]: false }));
    }, 2000);
  };

  const hasActiveFilters =
    brand !== "" ||
    selectedCategory !== "" ||
    onSaleOnly ||
    range[0] !== 0 ||
    range[1] !== Infinity;

  return (
    <>
      <Header />
      <main className="wrap search-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Từ khóa › {query}
        </div>

        {!terms.length ? (
          <section className="search-empty">
            <h1>Nhập từ khóa để tìm sản phẩm</h1>
            <form action="/catalogsearch/result">
              <input name="q" aria-label="Từ khóa tìm kiếm" required />
              <button>Tìm kiếm</button>
            </form>
          </section>
        ) : (
          <div className="listing">
            <aside className="filters search-filters">
              {/* DANH MỤC FILTER */}
              {categoriesInMatches.length > 0 && (
                <>
                  <h3>DANH MỤC</h3>
                  <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
                    {categoriesInMatches.map(cat => (
                      <label
                        key={cat}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name="search-category"
                          checked={selectedCategory === cat}
                          onChange={() => setSelectedCategory(cat)}
                        />{" "}
                        {cat}
                      </label>
                    ))}
                  </div>
                  {selectedCategory && (
                    <button
                      type="button"
                      style={{
                        fontSize: 12,
                        color: "#3d2e24",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 0 10px 0",
                        textDecoration: "underline",
                      }}
                      onClick={() => setSelectedCategory("")}
                    >
                      Bỏ chọn danh mục
                    </button>
                  )}
                </>
              )}

              {/* KHOẢNG GIÁ FILTER */}
              <h3>KHOẢNG GIÁ</h3>
              <div className="new-price">
                <input
                  type="number"
                  min="0"
                  aria-label="Giá từ"
                  placeholder="₫ TỪ"
                  value={min}
                  onChange={e => setMin(e.target.value)}
                />
                <span>–</span>
                <input
                  type="number"
                  min="0"
                  aria-label="Giá đến"
                  placeholder="₫ ĐẾN"
                  value={max}
                  onChange={e => setMax(e.target.value)}
                />
              </div>
              <button type="button" className="search-apply" onClick={applyPrice}>
                Áp dụng
              </button>
              {error && <p role="alert">{error}</p>}

              {/* THƯƠNG HIỆU FILTER */}
              <h3>THƯƠNG HIỆU</h3>
              <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gap: 6 }}>
                {brands.map(name => (
                  <label
                    key={name}
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="search-brand"
                      checked={brand === name}
                      onChange={() => setBrand(name)}
                    />{" "}
                    {name}
                  </label>
                ))}
              </div>
              {brand && (
                <button
                  type="button"
                  style={{
                    fontSize: 12,
                    color: "#3d2e24",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 0",
                    textDecoration: "underline",
                  }}
                  onClick={() => setBrand("")}
                >
                  Bỏ chọn thương hiệu
                </button>
              )}

              {/* SALE DISCOUNT CHECKBOX */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #e5e7eb" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#1f2937",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={e => setOnSaleOnly(e.target.checked)}
                  />
                  <span>Chỉ hiện sản phẩm đang giảm giá</span>
                </label>
              </div>

              {/* RESET ALL FILTERS */}
              {hasActiveFilters && (
                <button
                  type="button"
                  style={{ marginTop: 14, width: "100%" }}
                  onClick={() => {
                    setBrand("");
                    setSelectedCategory("");
                    setOnSaleOnly(false);
                    setMin("");
                    setMax("");
                    setRange([0, Infinity]);
                    setError("");
                  }}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </aside>

            <section className="listing-main">
              <div className="listing-header">
                <h1>Kết quả tìm kiếm “{query}”</h1>
                <span>({items.length} sản phẩm tìm thấy)</span>
              </div>

              <div className="listing-sort search-sort" role="group" aria-label="Sắp xếp sản phẩm">
                {sorts.map(([value, label]) => (
                  <Link
                    key={value}
                    className={sort === value ? "selected" : ""}
                    aria-current={sort === value ? "page" : undefined}
                    href={`/catalogsearch/result?${new URLSearchParams({ q: query, sort: value })}`}
                  >
                    {label}
                  </Link>
                ))}
              </div>

              {items.length ? (
                <div className="new-arrivals-grid">
                  {items.map(item => (
                    <div
                      key={item.slug}
                      className="new-arrival-card"
                      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                    >
                      <Link href={`/san-pham/${item.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: "#fafafa", borderRadius: 6, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={380}
                              height={380}
                              unoptimized
                              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
                            />
                          ) : (
                            <div className="search-image-placeholder">
                              ẢNH SẢN PHẨM
                              <br />
                              <b>{item.brand}</b>
                            </div>
                          )}
                          {item.sale > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                background: "#ff424e",
                                color: "#ffffff",
                                fontSize: 11,
                                fontWeight: "bold",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              -{item.sale}%
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <p style={{ margin: "4px 0", display: "flex", alignItems: "center", gap: 8 }}>
                            <strong>{money(item.price)}</strong>
                            {item.old > item.price && <del>{money(item.old)}</del>}
                          </p>
                          <small style={{ color: "#6b7280", textTransform: "uppercase", fontWeight: "bold" }}>
                            {item.brand}
                          </small>
                          <h2 style={{ fontSize: 13, lineHeight: 1.4, margin: "4px 0", maxHeight: 36, overflow: "hidden" }}>
                            {item.name}
                          </h2>
                          {item.categoryName && (
                            <span style={{ fontSize: 11, color: "#9ca3af" }}>
                              {item.categoryName}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Add to cart action button */}
                      <button
                        type="button"
                        className="search-add-btn"
                        onClick={e => handleAddToCart(e, item.slug)}
                        style={{
                          marginTop: 10,
                          width: "100%",
                          padding: "7px 12px",
                          borderRadius: 4,
                          background: addedSlugs[item.slug] ? "#166534" : "#3d2e24",
                          color: "#ffffff",
                          border: "none",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          transition: "background-color 0.2s",
                        }}
                      >
                        {addedSlugs[item.slug] ? (
                          <>
                            <Check size={14} /> Đã thêm vào giỏ
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={14} /> Thêm vào giỏ
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="search-empty">
                  <h2>Rất tiếc, không tìm thấy sản phẩm phù hợp.</h2>
                  <p>Kiểm tra lại từ khóa hoặc xóa bớt các bộ lọc đang chọn.</p>
                  <form action="/catalogsearch/result">
                    <input name="q" aria-label="Nhập lại từ khóa" required />
                    <button>Tìm kiếm</button>
                  </form>
                  <p>
                    Hỗ trợ khách hàng: <a href="tel:18006324">1800 6324</a>
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

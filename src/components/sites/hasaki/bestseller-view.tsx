"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { ProductCard } from "@/components/sites/hasaki/product-card";
import {
  getBestsellersSnapshot,
  matchesCategory
} from "@/lib/deals-bestsellers";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import type { Product } from "@/lib/catalog";

interface BestsellerViewProps {
  liveCatalog?: LiveCatalogOverridesState;
  initialSort?: string;
  initialBrand?: string;
  initialCategory?: string;
}

const BESTSELLER_CATEGORIES = [
  { name: "Tất cả danh mục", slug: "" },
  { name: "Chăm Sóc Da Mặt", slug: "cham-soc-da-mat-c4.html" },
  { name: "Trang Điểm", slug: "trang-diem-c23.html" },
  { name: "Chăm Sóc Cơ Thể", slug: "cham-soc-co-the-c12.html" },
  { name: "Chăm Sóc Tóc Và Da Đầu", slug: "cham-soc-toc-c96.html" },
  { name: "Chăm Sóc Cá Nhân", slug: "cham-soc-ca-nhan-c2049.html" },
  { name: "Phụ Kiện Điện Thoại", slug: "phu-kien-dien-thoai-c2474.html" },
  { name: "Nước Hoa", slug: "nuoc-hoa-c103.html" }
];

export function BestsellerView({
  initialSort = "topsale",
  initialBrand = "",
  initialCategory = "",
  liveCatalog
}: BestsellerViewProps) {
  const [brand, setBrand] = useState(initialBrand);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);

  const [minInput, setMinInput] = useState("");
  const [maxInput, setMaxInput] = useState("");
  const [appliedMin, setAppliedMin] = useState<number | null>(null);
  const [appliedMax, setAppliedMax] = useState<number | null>(null);
  const [priceError, setPriceError] = useState("");

  const allProducts = useMemo(() => getBestsellersSnapshot(liveCatalog), [liveCatalog]);

  const brands = useMemo(() => {
    return Array.from(new Set(allProducts.map(product => product.brand))).sort();
  }, [allProducts]);

  const handleApplyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPriceError("");
    const minVal = minInput.trim() ? Number(minInput) : null;
    const maxVal = maxInput.trim() ? Number(maxInput) : null;

    if (minVal !== null && isNaN(minVal)) {
      setPriceError("Giá tối thiểu không hợp lệ.");
      return;
    }
    if (maxVal !== null && isNaN(maxVal)) {
      setPriceError("Giá tối đa không hợp lệ.");
      return;
    }
    if (minVal !== null && maxVal !== null && minVal > maxVal) {
      setPriceError("Giá tối thiểu không được lớn hơn giá tối đa.");
      return;
    }

    setAppliedMin(minVal);
    setAppliedMax(maxVal);
  };

  const handleClearPrice = () => {
    setMinInput("");
    setMaxInput("");
    setAppliedMin(null);
    setAppliedMax(null);
    setPriceError("");
  };

  const items = useMemo(() => {
    const filtered = allProducts.filter(product => {
      if (brand && product.brand !== brand) return false;
      if (category && !matchesCategory(product.category, category)) return false;
      if (appliedMin !== null && product.price < appliedMin) return false;
      if (appliedMax !== null && product.price > appliedMax) return false;
      return true;
    });

    if (sort === "low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "topsale") {
      filtered.sort((a, b) => a.rank - b.rank);
    }

    return filtered;
  }, [allProducts, brand, category, appliedMin, appliedMax, sort]);

  return (
    <>
      <Header />
      <main className="wrap bestseller-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Sản Phẩm Bán Chạy
        </div>
        <div className="listing">
          <aside className="filters">
            {/* Category Filter */}
            <h3>DANH MỤC</h3>
            {BESTSELLER_CATEGORIES.map(cat => (
              <label key={cat.slug || "all"}>
                <input
                  type="radio"
                  name="bestseller-category"
                  checked={category === cat.slug}
                  onChange={() => setCategory(cat.slug)}
                />{" "}
                {cat.name}
              </label>
            ))}
            {category && (
              <button type="button" onClick={() => setCategory("")}>
                Xóa lọc danh mục
              </button>
            )}

            {/* Brand Filter */}
            <h3>THƯƠNG HIỆU</h3>
            {brands.map(name => (
              <label key={name}>
                <input
                  type="radio"
                  name="bestseller-brand"
                  checked={brand === name}
                  onChange={() => setBrand(name)}
                />{" "}
                {name}
              </label>
            ))}
            {brand && (
              <button type="button" onClick={() => setBrand("")}>
                Xóa bộ lọc
              </button>
            )}

            {/* Price Filter */}
            <h3>KHOẢNG GIÁ</h3>
            <form onSubmit={handleApplyPrice} style={{ display: "grid", gap: "6px" }}>
              <input
                type="number"
                placeholder="Từ (₫)"
                value={minInput}
                onChange={e => setMinInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  fontSize: "12px"
                }}
              />
              <input
                type="number"
                placeholder="Đến (₫)"
                value={maxInput}
                onChange={e => setMaxInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  fontSize: "12px"
                }}
              />
              <button
                type="submit"
                style={{
                  background: "#3d2e24",
                  color: "white",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "bold"
                }}
              >
                Áp dụng
              </button>
              {priceError && (
                <p
                  role="alert"
                  style={{ color: "#d32f2f", fontSize: "11px", margin: "4px 0 0" }}
                >
                  {priceError}
                </p>
              )}
              {(appliedMin !== null || appliedMax !== null) && (
                <button
                  type="button"
                  onClick={handleClearPrice}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#3d2e24",
                    cursor: "pointer",
                    fontSize: "12px",
                    textAlign: "left",
                    padding: "2px 0"
                  }}
                >
                  Xóa lọc giá
                </button>
              )}
            </form>
          </aside>

          <div className="listing-main">
            <div className="listing-header">
              <h1>Sản Phẩm Bán Chạy</h1>
              <span>({items.length} sản phẩm mẫu)</span>
            </div>
            <p className="bestseller-notice">
              Danh sách và thứ hạng dựa trên dữ liệu ảnh chụp từ Nari Home ngày 13/11/2026. Giá và khuyến mãi là dữ liệu ảnh chụp; giỏ hàng là mô phỏng frontend.
            </p>
            <div className="listing-sort" role="group" aria-label="Sắp xếp sản phẩm">
              {[
                ["topsale", "Bán chạy"],
                ["low", "Giá thấp đến cao"],
                ["high", "Giá cao đến thấp"]
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={sort === value ? "selected" : ""}
                  aria-pressed={sort === value}
                  onClick={() => setSort(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {items.length ? (
              <div className="listing-cards">
                {items.map(product => (
                  <div
                    key={product.slug}
                    className="bestseller-card-wrap"
                    style={{ position: "relative", display: "flex", flexDirection: "column" }}
                  >
                    {product.rank && (
                      <span
                        className="bestseller-rank-badge"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          zIndex: 3,
                          background:
                            product.rank === 1
                              ? "#fa4a41"
                              : product.rank === 2
                              ? "#ff7800"
                              : product.rank === 3
                              ? "#f4a100"
                              : "#555",
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                          pointerEvents: "none"
                        }}
                      >
                        TOP {product.rank}
                      </span>
                    )}
                    <ProductCard product={product as Product} showSampleRating />
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-list">Không tìm thấy sản phẩm bán chạy phù hợp với bộ lọc.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

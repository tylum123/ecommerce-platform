"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Tag,
  Zap,
  Flame,
  Check,
  ShoppingCart,
  ExternalLink,
  Crown,
} from "lucide-react";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { getTagPageData } from "@/lib/campaigns-location";
import { products as baseProducts, money } from "@/lib/catalog";
import { newArrivals } from "@/lib/new-arrivals";
import { addToCart } from "@/lib/cart";

interface TagProductItem {
  slug: string;
  name: string;
  brand: string;
  price: number;
  old: number;
  sale: number;
  image?: string;
  rating?: number;
  isHighEnd?: boolean;
}

export function TagView({ slug }: { slug: string }) {
  const tagData = getTagPageData(slug);

  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"bestseller" | "price-asc" | "price-desc" | "discount">("bestseller");
  const [addedItem, setAddedItem] = useState<string>("");

  const isDaiTiec = tagData.slug === "dai-tiec-hang-hieu.html";

  // Build unified product pool
  const allTagProducts: TagProductItem[] = useMemo(() => {
    const base: TagProductItem[] = baseProducts.map((p) => ({
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      price: p.price,
      old: p.old,
      sale: p.sale,
      image: p.image,
      rating: 4.9,
      isHighEnd: ["Bioderma", "CeraVe", "Skin1004", "Klairs", "Anker"].includes(p.brand),
    }));

    const arrivals: TagProductItem[] = newArrivals.map((item) => {
      const p = item.numericPrice || 250000;
      const o = item.numericOld || Math.round(p * 1.35);
      const discount = o > p ? Math.round(((o - p) / o) * 100) : 15;
      return {
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        price: p,
        old: o,
        sale: discount,
        image: item.image,
        rating: 4.8,
        isHighEnd: p > 250000 || ["Cocoon", "Lifebuoy", "Dove"].includes(item.brand),
      };
    });

    const pool = [...base, ...arrivals];

    // If "dai-tiec-hang-hieu", prioritize high-end & best brands
    if (isDaiTiec) {
      return pool.filter((p) => p.isHighEnd || p.price >= 200000);
    }

    return pool;
  }, [isDaiTiec]);

  // Extract unique brands for filter buttons
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    allTagProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return ["all", ...Array.from(set).slice(0, 8)];
  }, [allTagProducts]);

  // Filter & sort
  const displayedProducts = useMemo(() => {
    let result = [...allTagProducts];

    if (selectedBrand !== "all") {
      result = result.filter(
        (p) => p.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    if (selectedPriceRange === "under-200") {
      result = result.filter((p) => p.price < 200000);
    } else if (selectedPriceRange === "200-400") {
      result = result.filter((p) => p.price >= 200000 && p.price <= 400000);
    } else if (selectedPriceRange === "over-400") {
      result = result.filter((p) => p.price > 400000);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      result.sort((a, b) => b.sale - a.sale);
    } else if (sortBy === "bestseller") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [allTagProducts, selectedBrand, selectedPriceRange, sortBy]);

  function handleAddToCart(itemSlug: string) {
    addToCart(itemSlug, 1);
    setAddedItem(itemSlug);
    setTimeout(() => {
      setAddedItem("");
    }, 2000);
  }

  return (
    <>
      <Header />

      <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "50px" }}>
        {/* Breadcrumb strip */}
        <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div className="wrap" style={{ padding: "10px 0" }}>
            <nav className="breadcrumbs" aria-label="Breadcrumb" style={{ padding: 0 }}>
              <Link href="/">Trang chủ</Link>
              <span style={{ margin: "0 8px", color: "#9ca3af" }}>›</span>
              <span style={{ color: "#6b7280" }}>Tag</span>
              <span style={{ margin: "0 8px", color: "#9ca3af" }}>›</span>
              <span style={{ color: "#3d2e24", fontWeight: 600 }}>{tagData.heading}</span>
            </nav>
          </div>
        </div>

        {/* Hero Tag Banner */}
        <div className="wrap" style={{ marginTop: "14px" }}>
          <div
            style={{
              background: isDaiTiec
                ? "linear-gradient(135deg, #1b3524 0%, #29563d 50%, #153322 100%)"
                : "linear-gradient(135deg, #1e4d36 0%, #2f7a55 100%)",
              borderRadius: "10px",
              padding: "26px 30px",
              color: "#ffffff",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "relative", zIndex: 2, maxWidth: "780px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: isDaiTiec ? "#f59e0b" : "rgba(255, 255, 255, 0.2)",
                  color: isDaiTiec ? "#111827" : "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "12px",
                }}
              >
                {isDaiTiec ? <Crown size={15} /> : <Tag size={14} />}
                <span>{isDaiTiec ? "SPECIAL LUXURY SELECTION" : "NARI HOME CAMPAIGN TAG"}</span>
              </div>

              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  margin: "0 0 10px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              >
                {tagData.heading}
              </h1>

              <p style={{ margin: "0 0 16px", fontSize: "14px", opacity: 0.95, lineHeight: 1.6 }}>
                {tagData.description}
              </p>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    backgroundColor: "#e85029",
                    color: "#ffffff",
                    padding: "5px 12px",
                    borderRadius: "4px",
                    fontWeight: 700,
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Flame size={14} /> ƯU ĐÃI ĐẾN 50%
                </span>
                <span
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#1e4d36",
                    padding: "5px 12px",
                    borderRadius: "4px",
                    fontWeight: 600,
                    fontSize: "12px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <Zap size={14} color="#e85029" /> NARINOW 2H NỘI THÀNH
                </span>
                <a
                  href={tagData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#ffffff",
                    fontSize: "12px",
                    textDecoration: "underline",
                    opacity: 0.9,
                    marginLeft: "8px",
                  }}
                >
                  Xem tag gốc trên Nari Home
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Sorting Bar */}
        <div className="wrap" style={{ marginTop: "16px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "14px 18px",
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Brand Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151", minWidth: "90px" }}>
                Thương hiệu:
              </span>
              {availableBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    borderRadius: "16px",
                    border: selectedBrand === brand ? "1px solid #3d2e24" : "1px solid #e5e7eb",
                    backgroundColor: selectedBrand === brand ? "#e8f4ed" : "#f9fafb",
                    color: selectedBrand === brand ? "#23553e" : "#4b5563",
                    fontWeight: selectedBrand === brand ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {brand === "all" ? "Tất cả thương hiệu" : brand}
                </button>
              ))}
            </div>

            {/* Price Filter */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#374151", minWidth: "90px" }}>
                Khoảng giá:
              </span>
              {[
                { id: "all", label: "Tất cả mức giá" },
                { id: "under-200", label: "Dưới 200.000₫" },
                { id: "200-400", label: "200.000₫ - 400.000₫" },
                { id: "over-400", label: "Trên 400.000₫" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(p.id)}
                  style={{
                    padding: "5px 12px",
                    fontSize: "12px",
                    borderRadius: "16px",
                    border: selectedPriceRange === p.id ? "1px solid #3d2e24" : "1px solid #e5e7eb",
                    backgroundColor: selectedPriceRange === p.id ? "#e8f4ed" : "#f9fafb",
                    color: selectedPriceRange === p.id ? "#23553e" : "#4b5563",
                    fontWeight: selectedPriceRange === p.id ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Sort row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "10px",
                borderTop: "1px solid #f3f4f6",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ fontSize: "13px", color: "#6b7280" }}>
                Hiển thị <strong>{displayedProducts.length}</strong> sản phẩm cho chuyên đề{" "}
                <strong>{tagData.heading}</strong>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Sắp xếp:</span>
                {(
                  [
                    { id: "bestseller", label: "Bán chạy" },
                    { id: "discount", label: "% Giảm nhiều" },
                    { id: "price-asc", label: "Giá tăng dần" },
                    { id: "price-desc", label: "Giá giảm dần" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSortBy(s.id)}
                    style={{
                      padding: "5px 10px",
                      fontSize: "12px",
                      borderRadius: "4px",
                      border: sortBy === s.id ? "1px solid #e85029" : "1px solid #d1d5db",
                      backgroundColor: sortBy === s.id ? "#fff5f0" : "#ffffff",
                      color: sortBy === s.id ? "#e85029" : "#374151",
                      fontWeight: sortBy === s.id ? 700 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="wrap" style={{ marginTop: "16px" }}>
          {displayedProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                gap: "10px",
              }}
            >
              {displayedProducts.map((product) => {
                const isJustAdded = addedItem === product.slug;
                return (
                  <div
                    key={product.slug}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "6px",
                      border: "1px solid #e5e7eb",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Link
                      href={`/san-pham/${product.slug}`}
                      style={{
                        position: "relative",
                        display: "block",
                        backgroundColor: "#f9fafb",
                        height: "190px",
                        overflow: "hidden",
                      }}
                    >
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={210}
                          height={190}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            padding: "8px",
                          }}
                          unoptimized
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontSize: "12px",
                            backgroundColor: "#f3f4f6",
                          }}
                        >
                          <strong style={{ fontSize: "14px", color: "#4b5563" }}>{product.brand}</strong>
                          <span>Ảnh sản phẩm</span>
                        </div>
                      )}

                      {product.sale > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            left: "8px",
                            backgroundColor: "#e85029",
                            color: "#ffffff",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "3px 7px",
                            borderRadius: "3px",
                          }}
                        >
                          -{product.sale}%
                        </div>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          bottom: "8px",
                          left: "8px",
                          backgroundColor: "#3d2e24",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                        }}
                      >
                        <Zap size={11} /> NariNow 2H
                      </div>
                    </Link>

                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {product.brand}
                      </span>

                      <Link
                        href={`/san-pham/${product.slug}`}
                        title={product.name}
                        style={{
                          fontSize: "13px",
                          lineHeight: "1.4",
                          height: "38px",
                          overflow: "hidden",
                          color: "#111827",
                          marginBottom: "8px",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {product.name}
                      </Link>

                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                          <strong style={{ fontSize: "16px", color: "#e85029", fontWeight: 700 }}>
                            {money(product.price)}
                          </strong>
                          {product.old > product.price && (
                            <del style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {money(product.old)}
                            </del>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(product.slug)}
                          style={{
                            width: "100%",
                            marginTop: "10px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: isJustAdded ? "1px solid #16a34a" : "1px solid #3d2e24",
                            backgroundColor: isJustAdded ? "#16a34a" : "#ffffff",
                            color: isJustAdded ? "#ffffff" : "#3d2e24",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {isJustAdded ? (
                            <>
                              <Check size={14} />
                              Đã thêm vào giỏ
                            </>
                          ) : (
                            <>
                              <ShoppingCart size={14} />
                              THÊM VÀO GIỎ
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                padding: "50px 20px",
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              <Tag size={40} color="#9ca3af" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "16px", color: "#374151", margin: "0 0 6px" }}>
                Không tìm thấy sản phẩm trong danh mục này
              </h3>
              <p style={{ fontSize: "13px", margin: "0 0 16px" }}>
                Hãy thử chọn lại bộ lọc hoặc khoảng giá khác.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedPriceRange("all");
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#3d2e24",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

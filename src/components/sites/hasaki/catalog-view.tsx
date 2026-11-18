"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import {
  ShieldCheck,
  ChevronRight,
  Truck,
  RotateCcw,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import {
  categories,
  categoryProducts,
  getCategoryTitle,
  money,
  productBreadcrumbs,
  getAllCatalogProducts,
  findCatalogProduct,
} from "@/lib/catalog";
import { ProductCard } from "@/components/sites/hasaki/product-card";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import { ProductRichSections } from "@/components/sites/hasaki/product-rich-sections";
import { getRichProductDetail } from "@/lib/product-details";
import {
  getCategoryFacets,
  matchesDynamicFacet,
} from "@/lib/category-facets";
import { addToCart } from "@/lib/cart";
import {
  getInteractiveUiData,
  computeGiftBillPromo,
  computeProductEnglishSubtitle,
  type ProductBranchStockSummary,
} from "@/lib/interactive-ui";

const BRAND_SLUG_TO_NAME_MAP: Record<string, string> = {
  "cerave": "CeraVe",
  "cocoon": "Cocoon",
  "klairs": "Klairs",
  "bioderma": "Bioderma",
  "cetaphil": "Cetaphil",
  "l-oreal": "L'Oreal",
  "la-roche-posay": "La Roche-Posay",
  "skin1004": "Skin1004",
};

export function CategoryView({ slug, liveCatalog }: { slug: string; liveCatalog?: LiveCatalogOverridesState }) {
  const uiData = useMemo(() => getInteractiveUiData(), []);
  const found: [string, string] = useMemo(() => {
    if (liveCatalog?.source === "postgres") {
      const category = liveCatalog.references?.categories.find(item => item.slug === slug);
      return [category?.label || slug, slug];
    }
    const exact = categories.find(([, s]) => s === slug);
    if (exact) return [exact[0], exact[1]];
    return [getCategoryTitle(slug), slug];
  }, [slug, liveCatalog]);
  const all = useMemo(() => categoryProducts(slug, liveCatalog), [slug, liveCatalog]);

  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("snapshot");
  const [pageSize, setPageSize] = useState(40);

  // Price range filter
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [priceError, setPriceError] = useState("");

  // Dynamic Nari Home facets filter (all 14 groups from scraped Nari Home facet dataset)
  const [selectedFacets, setSelectedFacets] = useState<Record<string, string[]>>({});
  const facetGroups = useMemo(() => liveCatalog?.source === "postgres" ? [] : getCategoryFacets(slug), [slug, liveCatalog]);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const available = useMemo(() => [...new Set(all.map((p) => p.brand))], [all]);

  // Option counts for facet options computed against current category products
  const optionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const group of facetGroups) {
      for (const opt of group.options) {
        const key = `${group.key}:::${opt.label}`;
        counts[key] = all.filter((p) =>
          matchesDynamicFacet(p, group.key, opt.label)
        ).length;
      }
    }
    return counts;
  }, [facetGroups, all]);

  const handleApplyPrice = () => {
    const low = minPriceInput.trim()
      ? Number(minPriceInput.replace(/\D/g, ""))
      : 0;
    const high = maxPriceInput.trim()
      ? Number(maxPriceInput.replace(/\D/g, ""))
      : Infinity;
    if (isNaN(low) || isNaN(high) || low < 0 || high < low) {
      setPriceError("Vui lòng nhập khoảng giá hợp lệ.");
      return;
    }
    setPriceError("");
    setPriceRange([low, high]);
  };

  const handleToggleFacet = (groupKey: string, optionLabel: string) => {
    setSelectedFacets((prev) => {
      const current = prev[groupKey] || [];
      const exists = current.includes(optionLabel);
      const next = exists
        ? current.filter((l) => l !== optionLabel)
        : [...current, optionLabel];
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[groupKey];
        return copy;
      }
      return { ...prev, [groupKey]: next };
    });
  };

  const handleClearAllFilters = () => {
    setBrand("");
    setPriceRange([0, Infinity]);
    setMinPriceInput("");
    setMaxPriceInput("");
    setPriceError("");
    setSelectedFacets({});
  };

  // Filter & sort products
  const list = useMemo(() => {
    const filtered = all.filter((p) => {
      // 1. Brand
      if (brand && p.brand.toLowerCase() !== brand.toLowerCase()) {
        return false;
      }
      // 2. Price range
      if (p.price < priceRange[0] || p.price > priceRange[1]) {
        return false;
      }
      // 3. Facets
      for (const [groupKey, selectedOptions] of Object.entries(selectedFacets)) {
        if (selectedOptions && selectedOptions.length > 0) {
          const matchesAny = selectedOptions.some((optLabel) =>
            matchesDynamicFacet(p, groupKey, optLabel)
          );
          if (!matchesAny) {
            return false;
          }
        }
      }
      return true;
    });

    if (sort === "low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "discount") {
      filtered.sort((a, b) => b.sale - a.sale);
    }
    return filtered;
  }, [all, brand, priceRange, selectedFacets, sort]);

  const visibleList = useMemo(() => list.slice(0, pageSize), [list, pageSize]);

  const hasActiveFilters = Boolean(
    brand ||
      priceRange[0] > 0 ||
      priceRange[1] < Infinity ||
      Object.keys(selectedFacets).length > 0
  );

  if (!found) {
    return (
      <>
        <Header />
        <main className="wrap missing">
          <h1>Không tìm thấy danh mục</h1>
          <Link href="/">Về trang chủ</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="wrap">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Danh mục › {found[0]}
        </div>

        {/* 8-Brand Logo Strip Banner (Scraped from live Nari Home Category header) */}
        {liveCatalog?.source !== "postgres" && uiData.categoryPageUi.brandBannerLogos.length > 0 && (
          <div
            className="hasaki-brand-strip"
            aria-label="Thương hiệu nổi bật trong danh mục"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
              gap: 8,
              background: "#ffffff",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              marginBottom: 14,
            }}
          >
            {uiData.categoryPageUi.brandBannerLogos.map((item) => {
              const slugKey = item.href
                .replace("/thuong-hieu/", "")
                .replace(".html", "");
              const mappedBrand =
                BRAND_SLUG_TO_NAME_MAP[slugKey] ||
                available.find(
                  (b) => b.toLowerCase() === slugKey.replace(/-/g, " ")
                ) ||
                slugKey;
              const isSelected =
                brand.toLowerCase() === mappedBrand.toLowerCase();

              return (
                <button
                  key={item.href + item.src}
                  type="button"
                  onClick={() =>
                    setBrand((prev) =>
                      prev.toLowerCase() === mappedBrand.toLowerCase()
                        ? ""
                        : mappedBrand
                    )
                  }
                  title={`Lọc thương hiệu ${mappedBrand}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 54,
                    background: isSelected ? "#fff7ed" : "#ffffff",
                    border: isSelected
                      ? "2px solid #b86b4b"
                      : "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={item.src}
                    alt={mappedBrand}
                    width={110}
                    height={42}
                    unoptimized
                    style={{
                      maxHeight: 38,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="listing">
          <aside className="filters">
            {/* SỨC KHỎE - LÀM ĐẸP Category Tree (Scraped from live Nari Home Left Sidebar) */}
            <h3>{liveCatalog?.source === "postgres" ? "Danh mục" : "Sức Khỏe - Làm Đẹp"}</h3>
            {(liveCatalog?.source === "postgres" ? (liveCatalog.references?.categories || []).map(item => ({ label: item.label, href: `/danh-muc/${item.slug}` })) : uiData.categoryPageUi.sidebarCategoryTree).map((node) => {
              const nodeSlug = node.href.replace("/danh-muc/", "");
              return (
                <Link
                  key={node.href}
                  className={nodeSlug === slug ? "filter-active" : ""}
                  href={node.href}
                >
                  {node.label}
                  <ChevronRight size={13} />
                </Link>
              );
            })}

            <h3>Khoảng giá</h3>
            <div
              className="price-inputs"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                margin: "8px 0",
              }}
            >
              <input
                type="number"
                placeholder="₫ TỪ"
                value={minPriceInput}
                onChange={(e) => setMinPriceInput(e.target.value)}
                aria-label="Giá từ"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
              <span>–</span>
              <input
                type="number"
                placeholder="₫ ĐẾN"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                aria-label="Giá đến"
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleApplyPrice}
              style={{
                width: "100%",
                background: "#3d2e24",
                color: "white",
                border: 0,
                borderRadius: 3,
                padding: "7px 0",
                fontSize: 12,
                fontWeight: "bold",
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              Áp dụng
            </button>
            {priceError && (
              <small
                style={{
                  color: "#e53e3e",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                {priceError}
              </small>
            )}

            <h3 style={{ marginTop: 18 }}>Thương hiệu</h3>
            {available.length ? (
              available.map((b) => (
                <label key={b}>
                  <input
                    type="radio"
                    name="brand"
                    checked={brand.toLowerCase() === b.toLowerCase()}
                    onChange={() => setBrand(b)}
                  />{" "}
                  {b}
                </label>
              ))
            ) : (
              <small>Chưa có dữ liệu mẫu</small>
            )}
            {brand && (
              <button type="button" onClick={() => setBrand("")}>
                Xóa bộ lọc
              </button>
            )}

            {/* Deep Nari Home Facets (14 Scraped Filter Groups) */}
            {facetGroups.length > 0 && (
              <>
                <h3 style={{ marginTop: 24 }}>Bộ lọc chuyên sâu</h3>
                {facetGroups.map((group) => {
                  const isCollapsed = collapsedGroups[group.key] || false;
                  const activeCountInGroup =
                    selectedFacets[group.key]?.length || 0;
                  return (
                    <div
                      key={group.key}
                      className="facet-group-section"
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        paddingBottom: 10,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        onClick={() =>
                          setCollapsedGroups((prev) => ({
                            ...prev,
                            [group.key]: !prev[group.key],
                          }))
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          padding: "6px 0",
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          color: "#1f2937",
                        }}
                      >
                        <span>
                          {group.name}
                          {activeCountInGroup > 0 && (
                            <span
                              style={{
                                marginLeft: 6,
                                background: "#3d2e24",
                                color: "#fff",
                                borderRadius: 10,
                                padding: "1px 6px",
                                fontSize: 10,
                              }}
                            >
                              {activeCountInGroup}
                            </span>
                          )}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronUp size={14} />
                        )}
                      </div>

                      {!isCollapsed && (
                        <div
                          style={{
                            maxHeight: 180,
                            overflowY: "auto",
                            paddingRight: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          {group.options.map((opt) => {
                            const count =
                              optionCounts[`${group.key}:::${opt.label}`] ??
                              opt.count ??
                              0;
                            const isChecked =
                              selectedFacets[group.key]?.includes(opt.label) ||
                              false;
                            return (
                              <label
                                key={String(opt.value) + opt.label}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: 12,
                                  cursor: "pointer",
                                  margin: "2px 0",
                                  color: isChecked ? "#1f2937" : "#4b5563",
                                  fontWeight: isChecked ? "bold" : "normal",
                                }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() =>
                                      handleToggleFacet(group.key, opt.label)
                                    }
                                  />
                                  <span>{opt.label}</span>
                                </span>
                                <span
                                  style={{
                                    color: "#9ca3af",
                                    fontSize: 11,
                                    marginLeft: 6,
                                  }}
                                >
                                  ({count})
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </aside>

          <div className="listing-main">
            <div className="listing-header">
              <h1>{found[0]}</h1>
              <span>({list.length} sản phẩm)</span>
            </div>

            {/* 1:1 Nari Home Sort Bar + Hiển thị 40/60/80 Selector */}
            <div
              className="listing-sort"
              role="group"
              aria-label="Sắp xếp sản phẩm"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                    marginRight: 4,
                    fontWeight: 600,
                  }}
                >
                  Sắp xếp
                </span>
                {[
                  ["snapshot", "Thứ tự dữ liệu"],
                  ["low", "Giá thấp đến cao"],
                  ["high", "Giá cao đến thấp"],
                  ["discount", "Giảm nhiều"],
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

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <select
                  aria-label="Số sản phẩm hiển thị"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  style={{
                    fontSize: 12,
                    padding: "5px 10px",
                    borderRadius: 4,
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    color: "#374151",
                  }}
                >
                  {uiData.categoryPageUi.pageSizeOptions.map((opt) => {
                    const num = Number(opt.replace(/\D/g, "")) || 40;
                    return (
                      <option key={opt} value={num}>
                        {opt}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Active filters summary bar */}
            {hasActiveFilters && (
              <div
                className="active-filters-summary"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 8,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: "10px 14px",
                  margin: "12px 0",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#374151",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Filter size={13} /> Đang lọc theo:
                </span>

                {brand && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#eaf5ed",
                      color: "#25704a",
                      border: "1px solid #cce5d4",
                      borderRadius: 14,
                      padding: "2px 8px",
                      fontSize: 12,
                    }}
                  >
                    Thương hiệu: {brand}
                    <button
                      type="button"
                      onClick={() => setBrand("")}
                      style={{
                        border: 0,
                        background: "none",
                        color: "#25704a",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {(priceRange[0] > 0 || priceRange[1] < Infinity) && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "#eaf5ed",
                      color: "#25704a",
                      border: "1px solid #cce5d4",
                      borderRadius: 14,
                      padding: "2px 8px",
                      fontSize: 12,
                    }}
                  >
                    Giá:{" "}
                    {priceRange[0] === 0
                      ? `Dưới ${money(priceRange[1])}`
                      : priceRange[1] === Infinity
                        ? `Trên ${money(priceRange[0])}`
                        : `${money(priceRange[0])} – ${money(priceRange[1])}`}
                    <button
                      type="button"
                      onClick={() => {
                        setPriceRange([0, Infinity]);
                        setMinPriceInput("");
                        setMaxPriceInput("");
                      }}
                      style={{
                        border: 0,
                        background: "none",
                        color: "#25704a",
                        padding: 0,
                        cursor: "pointer",
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}

                {Object.entries(selectedFacets).flatMap(([groupKey, labels]) =>
                  labels.map((label) => (
                    <span
                      key={`${groupKey}-${label}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#eaf5ed",
                        color: "#25704a",
                        border: "1px solid #cce5d4",
                        borderRadius: 14,
                        padding: "2px 8px",
                        fontSize: 12,
                      }}
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => handleToggleFacet(groupKey, label)}
                        style={{
                          border: 0,
                          background: "none",
                          color: "#25704a",
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}

                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  style={{
                    marginLeft: "auto",
                    border: 0,
                    background: "none",
                    color: "#e53e3e",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Xóa bộ lọc
                </button>
              </div>
            )}

            <div className="listing-cards">
              {visibleList.map((p) => (
                <ProductCard key={p.slug} product={p} showSampleRating />
              ))}
            </div>

            {!list.length && (
              <div className="empty-list">
                Chưa có sản phẩm phù hợp với bộ lọc trong danh mục này.{" "}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    style={{
                      background: "none",
                      border: 0,
                      color: "#28774b",
                      textDecoration: "underline",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginRight: 6,
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
                <Link href="/danh-muc/cham-soc-da-mat-c4.html">
                  Xem sản phẩm chăm sóc da
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function ProductView({
  slug,
  brandHref,
  liveCatalog,
}: {
  slug: string;
  brandHref?: string;
  liveCatalog?: LiveCatalogOverridesState;
}) {
  const uiData = useMemo(() => getInteractiveUiData(), []);
  const p = findCatalogProduct(slug, liveCatalog);
  const richDetail = useMemo(() => getRichProductDetail(slug, liveCatalog), [slug, liveCatalog]);
  const galleryImages = useMemo(() => {
    const imgs = richDetail?.images?.filter(Boolean) ?? [];
    if (imgs.length > 0) return imgs;
    return p?.image ? [p.image] : [];
  }, [richDetail, p]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Sticky Top Bar on Scroll & Live Multi-Branch Stock Drawer
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [branchStock, setBranchStock] =
    useState<ProductBranchStockSummary | null>(null);
  const [showBranchModal, setShowBranchModal] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowStickyBar(window.scrollY > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!p) return;
    let active = true;
    fetch(`/api/ui-config?slug=${encodeURIComponent(p.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { branchStock?: ProductBranchStockSummary } | null) => {
        if (active && json?.branchStock) {
          setBranchStock(json.branchStock);
        }
      })
      .catch(() => {
        // Fallback handled gracefully
      });
    return () => {
      active = false;
    };
  }, [p]);

  if (!p) {
    return (
      <>
        <Header />
        <main className="wrap missing">
          <h1>Không tìm thấy sản phẩm</h1>
          <Link href="/">Về trang chủ</Link>
        </main>
        <Footer />
      </>
    );
  }

  const breadcrumbs = liveCatalog?.source === "postgres"
    ? (liveCatalog.references?.categories || []).filter(category => category.slug === p.category).map(category => [category.label, category.slug] as const)
    : productBreadcrumbs(p);
  const englishSubtitle = liveCatalog?.source === "postgres"
    ? richDetail?.englishName || ""
    : richDetail?.englishName || computeProductEnglishSubtitle(p);
  const computedPrice = p.price;
  const computedOldPrice = p.old;
  const savingsAmount = Math.max(0, computedOldPrice - computedPrice);

  const relatedProducts = getAllCatalogProducts(liveCatalog)
    .filter((item) => item.slug !== p.slug && item.category === p.category)
    .slice(0, 6);

  const sameBrandProducts = getAllCatalogProducts(liveCatalog)
    .filter(
      (item) =>
        item.slug !== p.slug &&
        item.brand.toLowerCase() === p.brand.toLowerCase()
    )
    .slice(0, 3);

  const handleAddToCart = () => {
    addToCart(p.slug, quantity);
    setAdded(true);
  };

  return (
    <>
      <Header />

      {/* Sticky Top Product Bar on Scroll (Scraped from 05-product-detail-scrolled.png) */}
      {showStickyBar && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
            borderBottom: "1px solid #e5e7eb",
            zIndex: 1100,
          }}
        >
          <div
            className="wrap"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "8px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                minWidth: 0,
                flex: 1,
              }}
            >
              {p.image && (
                <Image
                  src={p.image}
                  alt={p.name}
                  width={42}
                  height={42}
                  unoptimized
                  style={{
                    width: 42,
                    height: 42,
                    objectFit: "contain",
                    border: "1px solid #eee",
                    borderRadius: 4,
                  }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#111827",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: 420,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ fontSize: 14, color: "#b86b4b" }}>
                    {money(computedPrice)}
                  </strong>
                  <span style={{ fontSize: 11, color: "#226c47" }}>
                    Thương hiệu: <b>{p.brand}</b>
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <a href="#description">Thông tin sản phẩm</a>
              <a href="#product-reviews">Đánh giá</a>
              <a href="#product-questions">Hỏi đáp</a>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  background: "#b86b4b",
                  color: "#ffffff",
                  border: 0,
                  borderRadius: 5,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ShoppingCart size={15} /> THÊM VÀO GIỎ HÀNG
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="wrap">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> ›{" "}
          {breadcrumbs.map(([name, catSlug]) => (
            <span key={catSlug}>
              <Link href={`/danh-muc/${catSlug}`}>{name}</Link> ›{" "}
            </span>
          ))}
          {p.name}
        </div>

        <div className="detail">
          <div className="detail-gallery">
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  galleryImages.length > 0 ? "60px minmax(0, 1fr)" : "1fr",
                gap: 10,
                alignItems: "start",
              }}
            >
              {galleryImages.length > 0 && (
                <div
                  aria-label="Ảnh thu nhỏ sản phẩm"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 380,
                    overflowY: "auto",
                  }}
                >
                  {galleryImages.map((imgUrl, idx) => {
                    const isSelected = idx === activeImageIdx;
                    return (
                      <button
                        key={imgUrl + idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        style={{
                          width: 56,
                          height: 56,
                          padding: 2,
                          borderRadius: 4,
                          border: isSelected
                            ? "2px solid #3d2e24"
                            : "1px solid #e5e7eb",
                          background: "#ffffff",
                          cursor: "pointer",
                          flexShrink: 0,
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={imgUrl}
                          alt={`${p.name} - ảnh ${idx + 1}`}
                          width={50}
                          height={50}
                          unoptimized
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                className="detail-image"
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {galleryImages[activeImageIdx] || p.image ? (
                  <Image
                    src={galleryImages[activeImageIdx] || p.image || ""}
                    alt={p.name}
                    width={380}
                    height={380}
                    unoptimized
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <>
                    <span>ẢNH SẢN PHẨM</span>
                    <b>{p.brand}</b>
                  </>
                )}
              </div>
            </div>

            <p>Ảnh và giá theo dữ liệu sản phẩm đã ghi nhận; chưa hỗ trợ chọn biến thể.</p>
          </div>

          <div className="detail-info">
            {/* Ministry of Health Registration Badge + NariNow Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  background: "#b86b4b",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 3,
                }}
              >
                NariNow
              </span>
              {brandHref ? (
                <Link className="brand-link" href={brandHref}>
                  {p.brand}
                </Link>
              ) : (
                <Link
                  className="brand-link"
                  href={`/thuong-hieu/${p.brand
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")}.html`}
                >
                  {p.brand}
                </Link>
              )}
            </div>

            <h1>
              {p.name}
            </h1>
            <div
              style={{
                fontSize: 12,
                color: "#4b5563",
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {englishSubtitle}
            </div>

            <p className="detail-rating">
              {liveCatalog?.source !== "postgres" && <>★★★★★{" "}</>}
              <span>
                {liveCatalog?.source === "postgres" ? <>{typeof p.rating === "number" ? `★ ${p.rating}` : "Chưa có đánh giá"}{typeof p.reviewCount === "number" ? ` (${p.reviewCount} đánh giá)` : ""}　 |　 Mã SP: <b>{p.sku}</b></> : <>{p.rating ?? 4.9} ({p.reviewCount ?? 228} đánh giá)　 |　 Mã SP: <b>{branchStock?.sku || "100220035"}</b></>}
              </span>
            </p>

            {/* Price & VAT Row */}
            <div
              className="detail-price"
              style={{
                background: "#f8faf9",
                padding: "12px 14px",
                borderRadius: "0 0 6px 6px",
                border: "1px solid #e5e7eb",
                borderTop: 0,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <strong style={{ fontSize: 22, color: "#b86b4b" }}>
                  {money(computedPrice)}
                </strong>
                <span
                  style={{
                    fontSize: 12,
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  (Đã bao gồm VAT)
                </span>
              </div>
              {computedOldPrice > computedPrice && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 4,
                  }}
                >
                  Giá thị trường:{" "}
                  <del style={{ marginRight: 8 }}>{money(computedOldPrice)}</del>
                  - Tiết kiệm:{" "}
                  <b style={{ color: "#b86b4b" }}>
                    {money(savingsAmount)} (-{p.sale}%)
                  </b>
                </div>
              )}
            </div>

            <p>Đang xem đúng sản phẩm ghi trong tên và hình ảnh. Giá, khuyến mãi và tồn kho cần được xác nhận trước khi đặt hàng.</p>

            {/* Quantity + Live Multi-Branch Stock Badge */}
            <div
              className="quantity"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <b>Số lượng:</b>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span>{quantity}</span>
              <button type="button" onClick={() => setQuantity(quantity + 1)}>
                +
              </button>

              <button
                type="button"
                disabled={!branchStock}
                onClick={() => setShowBranchModal((prev) => !prev)}
                style={{
                  marginLeft: 8,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "#eef7f2",
                  color: "#226c47",
                  border: "1px solid #bce0cb",
                  borderRadius: 4,
                  padding: "5px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <MapPin size={14} />
                {branchStock
                  ? `Còn ${branchStock.branchesWithStockCount}/${branchStock.branches.length} CH có hàng (${branchStock.availableStock} SP tại kho)`
                  : liveCatalog?.source === "postgres" ? "Chưa có dữ liệu tồn kho" : "Còn 186 CH có hàng"}
              </button>
            </div>

            {/* Interactive Multi-Branch ERP Stock Drawer */}
            {showBranchModal && branchStock && (
              <div
                style={{
                  background: "#f8faf9",
                  border: "1px solid #cce3d6",
                  borderRadius: 6,
                  padding: "10px 12px",
                  marginBottom: 14,
                  fontSize: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <strong style={{ color: "#226c47" }}>
                    Tồn kho thực tế theo chi nhánh ERP (SKU: {branchStock.sku})
                  </strong>
                  <button
                    type="button"
                    onClick={() => setShowBranchModal(false)}
                    style={{
                      border: 0,
                      background: "none",
                      cursor: "pointer",
                      color: "#6b7280",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 6,
                  }}
                >
                  {branchStock.branches.map((br) => (
                    <div
                      key={br.branchId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#ffffff",
                        padding: "5px 8px",
                        borderRadius: 4,
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <span>{br.branchName}</span>
                      <b
                        style={{
                          color: br.inStock ? "#166534" : "#dc2626",
                        }}
                      >
                        {br.inStock ? `Còn ${br.quantity} SP` : "Hết hàng"}
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons: Giỏ hàng + Mua ngay NariNow 2H */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                className="buy-button"
                onClick={handleAddToCart}
                style={{
                  background: "#226c47",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ShoppingCart size={16} /> GIỎ HÀNG
              </button>
              <Link
                href="/gio-hang"
                onClick={handleAddToCart}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#b86b4b",
                  color: "#ffffff",
                  borderRadius: 5,
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                MUA NGAY NARINOW 2H
              </Link>
            </div>

            {added && (
              <p className="added">
                Đã thêm {quantity} × {p.name} vào giỏ hàng.{" "}
                <Link href="/gio-hang" style={{ textDecoration: "underline" }}>
                  Xem giỏ hàng ›
                </Link>
              </p>
            )}

            <div className="detail-services" style={{ marginTop: 14 }}>
              <p>
                <Truck /> Giao nhanh 2H NariNow
              </p>
              <p>
                <ShieldCheck /> Đền bù 100% nếu phát hiện hàng giả
              </p>
              <p>
                <RotateCcw /> Đổi trả trong 30 ngày
              </p>
            </div>
          </div>

          {/* Right Sidebar: - MIỄN PHÍ VẬN CHUYỂN - (4 Official Nari Home Policies) */}
          <aside className="detail-side">
            <h3
              style={{
                color: "#226c47",
                textAlign: "center",
                fontSize: 13,
                fontWeight: 800,
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: 8,
                marginBottom: 10,
              }}
            >
              - MIỄN PHÍ VẬN CHUYỂN -
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                marginBottom: 14,
              }}
            >
              {uiData.productDetailPageUi.shippingPolicies.map((pol) => (
                <div
                  key={pol.badge + pol.title}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    fontSize: 12,
                    lineHeight: 1.35,
                  }}
                >
                  <span
                    style={{
                      background: "#226c47",
                      color: "#ffffff",
                      fontWeight: 800,
                      fontSize: 10,
                      padding: "3px 6px",
                      borderRadius: 4,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {pol.badge}
                  </span>
                  <span style={{ color: "#374151" }}>
                    {pol.title} <b>{pol.subtitle}</b>
                  </span>
                </div>
              ))}
            </div>

            <hr />

            {/* Brand Official Card */}
            <div
              style={{
                marginTop: 12,
                padding: "10px",
                background: "#f8faf9",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#226c47",
                  marginBottom: 6,
                }}
              >
                {p.brand} Official
              </div>
              <Link
                href={brandHref || `/thuong-hieu/${p.brand
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")}.html`}
                style={{
                  display: "inline-block",
                  background: "#226c47",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 4,
                  textDecoration: "none",
                }}
              >
                Xem gian hàng chính hãng +
              </Link>
            </div>

            {sameBrandProducts.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <b style={{ fontSize: 12, color: "#111827" }}>
                  Sản phẩm cùng thương hiệu
                </b>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  {sameBrandProducts.map((sp) => (
                    <Link
                      key={sp.slug}
                      href={`/san-pham/${sp.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        textDecoration: "none",
                        color: "#1f2937",
                        fontSize: 11,
                      }}
                    >
                      {sp.image && (
                        <Image
                          src={sp.image}
                          alt={sp.name}
                          width={40}
                          height={40}
                          unoptimized
                          style={{
                            width: 40,
                            height: 40,
                            objectFit: "contain",
                            border: "1px solid #eee",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#b86b4b",
                          }}
                        >
                          {money(sp.price)}
                        </div>
                        <div
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: 150,
                          }}
                        >
                          {sp.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Lower 2-Column Product Detail Layout: Left (Specs, Description, Reviews, Q&A) + Right (Sản phẩm xem cùng & Sản phẩm cùng thương hiệu) */}
        <div className="detail-lower-grid" id="description">
          <div style={{ minWidth: 0 }}>
            <ProductRichSections slug={slug} productName={p.name} liveCatalog={liveCatalog} />
          </div>

          <aside className="detail-lower-side">
            <section
              aria-label="Sản phẩm xem cùng"
              style={{
                background: "#ffffff",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                padding: 14,
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  margin: "0 0 12px",
                  color: "#111827",
                }}
              >
                Sản phẩm xem cùng
              </h2>
              {relatedProducts.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {relatedProducts.slice(0, 5).map((item) => {
                    const promo = liveCatalog?.source === "postgres" ? null : computeGiftBillPromo(item);
                    return (
                      <Link
                        key={item.slug}
                        href={`/san-pham/${item.slug}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "82px minmax(0, 1fr)",
                          gap: 10,
                          textDecoration: "none",
                          color: "inherit",
                          alignItems: "start",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: 82,
                            height: 82,
                            border: "1px solid #f0f0f0",
                            borderRadius: 6,
                            overflow: "hidden",
                            background: "#fff",
                          }}
                        >
                          {item.image && (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={82}
                              height={82}
                              unoptimized
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                padding: 4,
                              }}
                            />
                          )}
                          {item.sale > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: 4,
                                right: 4,
                                background: "#b86b4b",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "1px 5px",
                                borderRadius: 3,
                              }}
                            >
                              -{item.sale}%
                            </span>
                          )}
                        </div>
                        <div style={{ minWidth: 0, fontSize: 12, lineHeight: 1.35 }}>
                          <div style={{ fontWeight: 700, color: "#b86b4b", fontSize: 14 }}>
                            {money(item.price)}
                          </div>
                          {item.old > item.price && (
                            <del style={{ color: "#9ca3af", fontSize: 11 }}>
                              {money(item.old)}
                            </del>
                          )}
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#3d2e24",
                              marginTop: 2,
                            }}
                          >
                            {item.brand}
                          </div>
                          <div
                            style={{
                              color: "#374151",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              margin: "2px 0 4px",
                            }}
                          >
                            {item.name}
                          </div>
                          {promo && <span
                            style={{
                              display: "inline-block",
                              maxWidth: "100%",
                              padding: "1px 5px",
                              border: "1px dashed #b86b4b",
                              background: "#fff7ed",
                              color: "#ea580c",
                              borderRadius: 3,
                              fontSize: 10,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {promo.badgeText.replace(/^🎁\s*/, "")}
                          </span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                  Chưa có sản phẩm liên quan trong dữ liệu mẫu.
                </p>
              )}
            </section>

            {sameBrandProducts.length > 0 && (
              <section
                aria-label="Sản phẩm cùng thương hiệu"
                style={{
                  background: "#ffffff",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: 14,
                }}
              >
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: "0 0 12px",
                    color: "#111827",
                  }}
                >
                  Sản phẩm cùng thương hiệu
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {sameBrandProducts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/san-pham/${item.slug}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "82px minmax(0, 1fr)",
                        gap: 10,
                        textDecoration: "none",
                        color: "inherit",
                        alignItems: "start",
                      }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: 82,
                          height: 82,
                          border: "1px solid #f0f0f0",
                          borderRadius: 6,
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={82}
                            height={82}
                            unoptimized
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: 4,
                            }}
                          />
                        )}
                        {item.sale > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              background: "#b86b4b",
                              color: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "1px 5px",
                              borderRadius: 3,
                            }}
                          >
                            -{item.sale}%
                          </span>
                        )}
                      </div>
                      <div style={{ minWidth: 0, fontSize: 12, lineHeight: 1.35 }}>
                        <div style={{ fontWeight: 700, color: "#b86b4b", fontSize: 14 }}>
                          {money(item.price)}
                        </div>
                        {item.old > item.price && (
                          <del style={{ color: "#9ca3af", fontSize: 11 }}>
                            {money(item.old)}
                          </del>
                        )}
                        <div
                          style={{
                            fontWeight: 700,
                            color: "#3d2e24",
                            marginTop: 2,
                          }}
                        >
                          {item.brand}
                        </div>
                        <div
                          style={{
                            color: "#374151",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            marginTop: 2,
                          }}
                        >
                          {item.name}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}

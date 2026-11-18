"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  Flame,
  Zap,
  MapPin,
  ExternalLink,
  ShoppingCart,
  Check,
  Sparkles,
  Tag,
} from "lucide-react";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { LocationDialog } from "@/components/sites/nari/location-dialog";
import {
  type CampaignWowData,
  readLocation,
  formatLocationShort,
  LOCATION_CHANGE_EVENT,
} from "@/lib/campaigns-location";
import { money } from "@/lib/catalog";
import { addToCart } from "@/lib/cart";

interface CampaignProductItem {
  slug: string;
  name: string;
  brand: string;
  price: number;
  old: number;
  sale: number;
  image?: string;
  rating?: number;
  isFlashDeal?: boolean;
}

export function CampaignWowView({ campaignData, products: allCampaignProducts }: { campaignData: CampaignWowData; products: CampaignProductItem[] }) {
  const [selectedSlot, setSelectedSlot] = useState<string>(
    campaignData.flashSlots[0]?.id || "slot-09"
  );
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "bestseller" | "price-asc" | "price-desc" | "discount">("popular");
  const [addedItem, setAddedItem] = useState<string>("");
  const [showLocationDialog, setShowLocationDialog] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<string>("Chọn khu vực của bạn");

  useEffect(() => {
    const updateLoc = () => {
      const loc = readLocation();
      setUserLocation(formatLocationShort(loc));
    };
    updateLoc();
    window.addEventListener(LOCATION_CHANGE_EVENT, updateLoc);
    window.addEventListener("storage", updateLoc);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, updateLoc);
      window.removeEventListener("storage", updateLoc);
    };
  }, []);

  // Filter brands list
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    allCampaignProducts.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return ["all", ...Array.from(set).slice(0, 8)];
  }, [allCampaignProducts]);

  // Filtered & Sorted items
  const displayedProducts = useMemo(() => {
    let result = [...allCampaignProducts];

    // Filter by Brand
    if (selectedBrand !== "all") {
      result = result.filter(
        (p) => p.brand.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Filter by Price range
    if (selectedPriceRange === "under-200") {
      result = result.filter((p) => p.price < 200000);
    } else if (selectedPriceRange === "200-400") {
      result = result.filter((p) => p.price >= 200000 && p.price <= 400000);
    } else if (selectedPriceRange === "over-400") {
      result = result.filter((p) => p.price > 400000);
    }

    // Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      result.sort((a, b) => b.sale - a.sale);
    }

    return result;
  }, [allCampaignProducts, selectedBrand, selectedPriceRange, sortBy]);

  function handleAddToCart(slug: string) {
    addToCart(slug, 1);
    setAddedItem(slug);
    setTimeout(() => {
      setAddedItem("");
    }, 2000);
  }

  const activeSlot = campaignData.flashSlots.find((s) => s.id === selectedSlot) || campaignData.flashSlots[0];

  return (
    <>
      <Header />

      <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "50px" }}>
        {/* Top Breadcrumb & Location Strip */}
        <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            <nav className="breadcrumbs" aria-label="Breadcrumb" style={{ padding: 0 }}>
              <Link href="/">Trang chủ</Link>
              <span style={{ margin: "0 8px", color: "#9ca3af" }}>›</span>
              <span style={{ color: "#3d2e24", fontWeight: 600 }}>Hot Deals - Campaign WOW</span>
            </nav>

            <button
              type="button"
              onClick={() => setShowLocationDialog(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                border: "1px solid #cfe8d9",
                background: "#f0f9f4",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                color: "#276245",
                fontWeight: 500,
              }}
            >
              <MapPin size={14} color="#3d2e24" />
              <span>Giao đến: <strong>{userLocation}</strong></span>
              <span style={{ color: "#e85029", marginLeft: "4px" }}>⚡ NariNow 2H</span>
            </button>
          </div>
        </div>

        {/* Campaign Hero Banner Section */}
        <div className="wrap" style={{ marginTop: "14px" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #1e4d36 0%, #2f7a55 50%, #4da277 100%)",
              borderRadius: "12px",
              padding: "24px 28px",
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
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  padding: "4px 12px",
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "10px",
                }}
              >
                <Sparkles size={14} />
                <span>CAMPAIGN WOW ĐỘC QUYỀN</span>
              </div>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  margin: "0 0 8px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.15)",
                }}
              >
                {campaignData.title.split("|")[0].trim()}
              </h1>
              <p style={{ margin: "0 0 16px", fontSize: "14px", opacity: 0.95, lineHeight: 1.5 }}>
                {campaignData.description}
              </p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <span
                  style={{
                    backgroundColor: "#ff7800",
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
                  <Flame size={14} /> SẢN PHẨM THEO CHƯƠNG TRÌNH
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
                  <Zap size={14} color="#ff7800" /> NARINOW 2H TOÀN QUỐC
                </span>
                <a
                  href="https://Nari Home/campaign/wow"
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
                  Mở trang gốc Nari Home/campaign/wow
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Campaign Visual Banners Strip */}
            {campaignData.banners && campaignData.banners.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${campaignData.banners.length}, 1fr)`,
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                {campaignData.banners.map((b, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <Image
                      src={b.src}
                      alt={b.alt || `Campaign Banner ${idx + 1}`}
                      width={640}
                      height={240}
                      style={{ width: "100%", height: "auto", display: "block" }}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Flash Time-Slot Navigation Bar */}
        <div className="wrap" style={{ marginTop: "16px" }}>
          <div
            style={{
              backgroundColor: "#2c3e50",
              borderRadius: "8px",
              padding: "6px",
              display: "grid",
              gridTemplateColumns: `repeat(${campaignData.flashSlots.length}, 1fr)`,
              gap: "6px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            }}
          >
            {campaignData.flashSlots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  style={{
                    backgroundColor: isSelected ? "#e85029" : "transparent",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={15} />
                    <strong style={{ fontSize: "14px" }}>{slot.time}</strong>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: isSelected ? 1 : 0.8,
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {slot.label} {isSelected ? "🔥" : ""}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      backgroundColor: isSelected ? "rgba(0, 0, 0, 0.25)" : "rgba(255, 255, 255, 0.12)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      marginTop: "2px",
                    }}
                  >
                    {slot.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slot Highlight Notice */}
          <div
            style={{
              backgroundColor: "#fff0e8",
              border: "1px solid #ffd2be",
              borderRadius: "6px",
              padding: "10px 16px",
              marginTop: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              color: "#c2410c",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Flame size={18} color="#e85029" />
              <span>
                Khung giờ <strong>{activeSlot.time}</strong> ({activeSlot.label}):{" "}
                <strong>{activeSlot.badge}</strong> — Số lượng ưu đãi có hạn, giá áp dụng tự động trong khung giờ!
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#666" }}>
              Cập nhật trực tiếp từ hệ thống Flash Deal Nari Home
            </span>
          </div>
        </div>

        {/* Filter & Sorting Controls */}
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
            {/* Brand Filter Buttons */}
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

            {/* Price Filter Buttons */}
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

            {/* Sort Toolbar */}
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
                Tìm thấy <strong>{displayedProducts.length}</strong> sản phẩm trong đợt Campaign WOW
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Sắp xếp theo:</span>
                {(
                  [
                    { id: "popular", label: "Nổi bật" },
                    { id: "bestseller", label: "Mặc định" },
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
                      transition: "box-shadow 0.2s ease",
                    }}
                  >
                    {/* Top image link */}
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

                      {/* Sale Badge */}
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

                      {/* NariNow 2H Badge */}
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

                    {/* Content */}
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

                        {/* Add to cart button */}
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
                Chưa có sản phẩm được xác nhận cho chương trình này
              </h3>
              <p style={{ fontSize: "13px", margin: "0 0 16px" }}>
                Hãy thử chọn lại khoảng giá hoặc xem tất cả thương hiệu.
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
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Footer campaign reassurance note */}
        <div className="wrap" style={{ marginTop: "25px" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              padding: "18px 24px",
              border: "1px solid #e5e7eb",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
              fontSize: "12px",
              color: "#4b5563",
            }}
          >
            <div>
              <strong style={{ color: "#1e4d36", display: "block", marginBottom: "4px" }}>
                ✓ 100% Chính Hãng
              </strong>
              <span>Cam kết đền bù 200% nếu phát hiện hàng giả, hàng nhái từ Nari Home.</span>
            </div>
            <div>
              <strong style={{ color: "#1e4d36", display: "block", marginBottom: "4px" }}>
                ⚡ NariNow Giao 2H
              </strong>
              <span>Giao siêu tốc nội thành cho đơn hàng đủ điều kiện tại hơn 100 chi nhánh.</span>
            </div>
            <div>
              <strong style={{ color: "#1e4d36", display: "block", marginBottom: "4px" }}>
                ↻ Đổi Trả 14 Ngày
              </strong>
              <span>Miễn phí đổi trả trong 14 ngày nếu lỗi từ nhà sản xuất hoặc kích ứng.</span>
            </div>
            <div>
              <strong style={{ color: "#1e4d36", display: "block", marginBottom: "4px" }}>
                🏷 Giá Luôn Tốt Nhất
              </strong>
              <span>Chính sách ở đâu rẻ hơn Nari Home hoàn tiền chênh lệch.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Location Modal */}
      {showLocationDialog && (
        <LocationDialog
          onClose={() => setShowLocationDialog(false)}
          onSaved={() => {
            const loc = readLocation();
            setUserLocation(formatLocationShort(loc));
          }}
        />
      )}
      <Footer />
    </>
  );
}

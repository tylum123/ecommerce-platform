"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  UserRound,
  MapPin,
  Store,
  Headphones,
  Menu,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Flame,
} from "lucide-react";
import { money } from "@/lib/catalog";
import { readCart } from "@/lib/cart";
import { AccountDialog } from "@/components/sites/hasaki/account-dialog";
import { LocationDialog } from "@/components/sites/hasaki/location-dialog";
import { readLocation, formatLocationShort } from "@/lib/campaigns-location";
import {
  readAuthSession,
  AUTH_CHANGE_EVENT,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";
import { getInteractiveUiData, searchCatalogLive } from "@/lib/interactive-ui";

export function Header() {
  const uiData = useMemo(() => getInteractiveUiData(), []);
  const [menu, setMenu] = useState(false);
  const [activeCatSlug, setActiveCatSlug] = useState<string>(
    uiData.megaMenu[0]?.slug || "cham-soc-da-mat-c4.html"
  );
  const [panel, setPanel] = useState<"account" | "location" | null>(null);
  const [cart, setCart] = useState(0);
  const [locationLabel, setLocationLabel] = useState("Chọn khu vực của bạn");
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(null);

  // Interactive Search Popup state (live Hasaki click/focus behavior)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement | null>(null);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const liveSearchResults = useMemo(
    () => searchCatalogLive(searchQuery, 6),
    [searchQuery]
  );

  const activeCategory = useMemo(
    () =>
      uiData.megaMenu.find((c) => c.slug === activeCatSlug) ||
      uiData.megaMenu[0],
    [uiData.megaMenu, activeCatSlug]
  );

  useEffect(() => {
    const refresh = () =>
      setCart(readCart().reduce((sum, item) => sum + item.quantity, 0));
    refresh();
    window.addEventListener("demo-cart-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("demo-cart-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const refreshLoc = () => {
      const loc = readLocation();
      setLocationLabel(formatLocationShort(loc));
    };
    refreshLoc();
    window.addEventListener("hasaki-location-change", refreshLoc);
    window.addEventListener("storage", refreshLoc);
    return () => {
      window.removeEventListener("hasaki-location-change", refreshLoc);
      window.removeEventListener("storage", refreshLoc);
    };
  }, []);

  useEffect(() => {
    const refreshAuth = () => setAuthUser(readAuthSession());
    refreshAuth();
    window.addEventListener(AUTH_CHANGE_EVENT, refreshAuth);
    window.addEventListener("storage", refreshAuth);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, refreshAuth);
      window.removeEventListener("storage", refreshAuth);
    };
  }, []);

  useEffect(() => {
    const open = () => setPanel("account");
    window.addEventListener("hasaki-open-account", open);
    return () => window.removeEventListener("hasaki-open-account", open);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setMenu(true);
  };

  const handleMenuMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setMenu(false);
    }, 180);
  };

  return (
    <>
      <div className="promo-strip">
        <Link
          href={uiData.topBanner.href}
          style={{
            color: "#fff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span>KHAI HỘI SIÊU SALE LỚN NHẤT NĂM</span>
          <b>1.11 SALE ĐẦU THÁNG</b>
          <b>11.11 SALE LỚN BÙNG NỔ</b>
          <b>16.11 SIÊU SALE GIỮA THÁNG</b>
        </Link>
      </div>

      <header className="header">
        <div className="wrap header-inner">
          <Link className="logo" href="/">
            <Image
              src="/hasaki-logo.png"
              alt="Hasaki.vn"
              width={180}
              height={42}
              unoptimized
            />
          </Link>

          <div
            className="search-area"
            ref={searchAreaRef}
            style={{ position: "relative" }}
          >
            <div className="popular">
              {uiData.searchPopup.topBarKeywords.map((kw, index) => (
                <span key={kw.label}>
                  {index > 0 && "　"}
                  <Link href={kw.href}>{kw.label}</Link>
                </span>
              ))}
            </div>

            <form
              className="search"
              action="/tim-kiem"
              onSubmit={() => setIsSearchOpen(false)}
            >
              <input
                name="q"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                autoComplete="off"
                aria-label="Tìm sản phẩm"
                placeholder="Tìm sản phẩm, thương hiệu bạn mong muốn..."
              />
              <button aria-label="Tìm kiếm" type="submit">
                <Search size={22} />
              </button>
            </form>

            {/* Interactive Search Popup (Scraped from live Hasaki click on #search) */}
            {isSearchOpen && (
              <div
                className="hasaki-search-popup"
                role="dialog"
                aria-label="Gợi ý tìm kiếm Hasaki"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  color: "#1f2937",
                  borderRadius: "0 0 8px 8px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
                  border: "1px solid #e5e7eb",
                  padding: "14px 16px",
                  zIndex: 1200,
                  maxHeight: 520,
                  overflowY: "auto",
                }}
              >
                {searchQuery.trim().length === 0 ? (
                  <>
                    {/* 3 Green Campaign Promo Pills */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        paddingBottom: 12,
                        borderBottom: "1px solid #f0f2f4",
                      }}
                    >
                      {uiData.searchPopup.promoPills.map((pill) => (
                        <Link
                          key={pill.label}
                          href={pill.href}
                          onClick={() => setIsSearchOpen(false)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            background: "#e8f5ee",
                            color: "#226c47",
                            border: "1px solid #bce0cb",
                            borderRadius: 4,
                            padding: "5px 10px",
                            fontSize: 12,
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <Sparkles size={13} />
                          {pill.label}
                        </Link>
                      ))}
                    </div>

                    {/* 6 Suggested Categories with 2x3 Horizontal Cards */}
                    <div style={{ marginTop: 12 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#111827",
                          marginBottom: 8,
                        }}
                      >
                        Danh mục được quan tâm
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                          gap: 8,
                        }}
                      >
                        {uiData.searchPopup.suggestedCategories.map((cat) => (
                          <Link
                            key={cat.label}
                            href={cat.href}
                            onClick={() => setIsSearchOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: "#f9fafb",
                              border: "1px solid #edf0f2",
                              textDecoration: "none",
                              color: "#1f2937",
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {cat.img && (
                              <Image
                                src={cat.img}
                                alt={cat.imgAlt}
                                width={38}
                                height={38}
                                unoptimized
                                style={{
                                  width: 38,
                                  height: 38,
                                  objectFit: "cover",
                                  borderRadius: 4,
                                  background: "#fff",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <span
                              style={{
                                lineHeight: 1.25,
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {cat.label}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* 8 Suggested Brand Logo Grid (2x4) */}
                    <div style={{ marginTop: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#111827",
                          }}
                        >
                          Thương hiệu nổi bật
                        </span>
                        <Link
                          href="/thuong-hieu"
                          onClick={() => setIsSearchOpen(false)}
                          style={{
                            fontSize: 12,
                            color: "#2a704c",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          Xem tất cả ›
                        </Link>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                          gap: 8,
                        }}
                      >
                        {uiData.searchPopup.suggestedBrands.map((b) => (
                          <Link
                            key={b.name}
                            href={b.href}
                            onClick={() => setIsSearchOpen(false)}
                            title={b.name}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 44,
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderRadius: 6,
                              padding: "4px 8px",
                              textDecoration: "none",
                            }}
                          >
                            {b.logo ? (
                              <Image
                                src={b.logo}
                                alt={b.name}
                                width={88}
                                height={32}
                                unoptimized
                                style={{
                                  maxHeight: 28,
                                  width: "auto",
                                  objectFit: "contain",
                                }}
                              />
                            ) : (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#226c47",
                                }}
                              >
                                {b.name}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Live Search Autocomplete Results */
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 8,
                        borderBottom: "1px solid #f0f2f4",
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#4b5563" }}>
                        Kết quả gợi ý cho từ khóa{" "}
                        <b style={{ color: "#226c47" }}>&ldquo;{searchQuery}&rdquo;</b>
                      </span>
                      <Link
                        href={`/tim-kiem?q=${encodeURIComponent(searchQuery)}`}
                        onClick={() => setIsSearchOpen(false)}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#ff6600",
                          textDecoration: "none",
                        }}
                      >
                        Xem tất cả kết quả ›
                      </Link>
                    </div>

                    {liveSearchResults.matchedBrands.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        {liveSearchResults.matchedBrands.map((mb) => (
                          <Link
                            key={mb.name}
                            href={mb.href}
                            onClick={() => setIsSearchOpen(false)}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 10px",
                              borderRadius: 12,
                              background: "#eef7f2",
                              color: "#226c47",
                              border: "1px solid #cce3d6",
                              textDecoration: "none",
                            }}
                          >
                            Thương hiệu: {mb.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {liveSearchResults.products.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {liveSearchResults.products.map((prod) => (
                          <Link
                            key={prod.slug}
                            href={`/san-pham/${prod.slug}`}
                            onClick={() => setIsSearchOpen(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "6px 8px",
                              borderRadius: 6,
                              background: "#f9fafb",
                              textDecoration: "none",
                              color: "#111827",
                            }}
                          >
                            {prod.image && (
                              <Image
                                src={prod.image}
                                alt={prod.name}
                                width={46}
                                height={46}
                                unoptimized
                                style={{
                                  width: 46,
                                  height: 46,
                                  objectFit: "contain",
                                  background: "#fff",
                                  borderRadius: 4,
                                  border: "1px solid #eee",
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#226c47",
                                }}
                              >
                                {prod.brand}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: "#1f2937",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {prod.name}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                  marginTop: 2,
                                }}
                              >
                                <strong
                                  style={{ fontSize: 13, color: "#ff6600" }}
                                >
                                  {money(prod.price)}
                                </strong>
                                {prod.old > prod.price && (
                                  <del
                                    style={{ fontSize: 11, color: "#9ca3af" }}
                                  >
                                    {money(prod.old)}
                                  </del>
                                )}
                                {prod.sale > 0 && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      background: "#ff6600",
                                      color: "#fff",
                                      borderRadius: 3,
                                      padding: "1px 4px",
                                    }}
                                  >
                                    -{prod.sale}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "14px 8px",
                          fontSize: 12,
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        Nhấn Enter để tìm kiếm sản phẩm cho &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="header-actions">
            <button onClick={() => setPanel("account")}>
              <UserRound />
              <span>
                {authUser ? (
                  <>
                    {isStaffOrAdminRole(authUser.role)
                      ? "Quản trị ERP"
                      : `Hạng ${authUser.tier || "Member"}`}
                    <br />
                    <b>{authUser.fullName} ⌄</b>
                  </>
                ) : (
                  <>
                    Đăng nhập / Đăng ký
                    <br />
                    <b>Tài khoản ⌄</b>
                  </>
                )}
              </span>
            </button>
            <Link href="/he-thong-cua-hang">
              <Store />
              <span>
                Hệ thống
                <br />
                <b>cửa hàng</b>
              </span>
            </Link>
            <Link href="/bao-hanh">
              <ShieldCheck />
              <span>
                Bảo
                <br />
                <b>hành</b>
              </span>
            </Link>
            <Link href="/ho-tro">
              <Headphones />
              <span>
                Hỗ trợ
                <br />
                <b>khách hàng</b>
              </span>
            </Link>
            <Link href="/gio-hang" aria-label={`Giỏ hàng ${cart} sản phẩm`}>
              <ShoppingCart />
              <em>{cart}</em>
            </Link>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="wrap nav-inner">
          <button
            onClick={() => setMenu((prev) => !prev)}
            onMouseEnter={handleMenuMouseEnter}
            onMouseLeave={handleMenuMouseLeave}
            aria-expanded={menu}
          >
            <Menu size={23} /> DANH MỤC
          </button>
          <Link href="/deals-dang-dien-ra.html?product_list_order=topsale">
            HASAKI DEALS
          </Link>
          <Link href="/campaign/wow">HOT DEALS</Link>
          <Link href="/thuong-hieu">THƯƠNG HIỆU</Link>
          <Link href="/hang-moi-ve.html?sort=position">HÀNG MỚI VỀ</Link>
          <Link href="/san-pham-ban-chay.html?sort=topsale">BÁN CHẠY</Link>
          <Link href="/clinic">CLINIC &amp; SPA</Link>
          <Link href="/danh-muc/dermahair-c2298.html">DERMAHAIR</Link>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Link
              href="/tra-cuu-don-hang"
              style={{ fontWeight: 500, fontSize: 12 }}
            >
              Tra cứu đơn hàng
            </Link>
            <Link
              href="/cam-nang.html"
              style={{ fontWeight: 500, fontSize: 12 }}
            >
              Tải ứng dụng
            </Link>
            <button
              className="location"
              onClick={() => setPanel("location")}
              style={{ marginLeft: 0 }}
            >
              <MapPin size={15} /> {locationLabel}
            </button>
          </div>
        </div>
      </nav>

      {/* Interactive 3-Column Hover/Click Mega Menu */}
      {menu && (
        <div
          className="menu-overlay"
          onMouseEnter={handleMenuMouseEnter}
          onMouseLeave={handleMenuMouseLeave}
        >
          <div className="wrap">
            <div
              className="hasaki-mega-menu"
              style={{
                display: "grid",
                gridTemplateColumns: "250px 1fr 270px",
                background: "#ffffff",
                borderRadius: "0 0 8px 8px",
                boxShadow: "0 14px 36px rgba(0,0,0,0.18)",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                minHeight: 410,
              }}
            >
              {/* Left Column: 16 Root Categories */}
              <div
                style={{
                  background: "#f8faf9",
                  borderRight: "1px solid #e5e7eb",
                  padding: "8px 0",
                  maxHeight: 460,
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    padding: "6px 14px 8px",
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    color: "#226c47",
                    letterSpacing: 0.4,
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  Sức Khỏe - Làm Đẹp
                </div>
                {uiData.megaMenu.map((cat) => {
                  const isActive = cat.slug === activeCategory?.slug;
                  return (
                    <Link
                      key={cat.slug}
                      href={cat.href}
                      onMouseEnter={() => setActiveCatSlug(cat.slug)}
                      onClick={() => setMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 14px",
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? "#ff6600" : "#1f2937",
                        background: isActive ? "#ffffff" : "transparent",
                        borderLeft: isActive
                          ? "3px solid #ff6600"
                          : "3px solid transparent",
                        textDecoration: "none",
                      }}
                    >
                      <span>{cat.name}</span>
                      <ChevronRight
                        size={14}
                        style={{
                          color: isActive ? "#ff6600" : "#9ca3af",
                        }}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Center Column: Subcategory & Service Groups for Hovered Root Category */}
              {activeCategory && (
                <div
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 10,
                        marginBottom: 14,
                        borderBottom: "1px solid #f0f2f4",
                      }}
                    >
                      <Link
                        href={activeCategory.href}
                        onClick={() => setMenu(false)}
                        style={{
                          fontSize: 16,
                          fontWeight: 800,
                          color: "#226c47",
                          textDecoration: "none",
                        }}
                      >
                        {activeCategory.name}
                      </Link>
                      <Link
                        href={activeCategory.href}
                        onClick={() => setMenu(false)}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#ff6600",
                          textDecoration: "none",
                        }}
                      >
                        Xem tất cả {activeCategory.name} ›
                      </Link>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 18,
                      }}
                    >
                      {activeCategory.groups.map((grp) => (
                        <div key={grp.title}>
                          <Link
                            href={grp.href}
                            onClick={() => setMenu(false)}
                            style={{
                              display: "block",
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#111827",
                              marginBottom: 8,
                              textDecoration: "none",
                            }}
                          >
                            {grp.title}
                          </Link>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {grp.items.map((item) => (
                              <Link
                                key={item.label + item.href}
                                href={item.href}
                                onClick={() => setMenu(false)}
                                style={{
                                  fontSize: 12,
                                  color: "#4b5563",
                                  textDecoration: "none",
                                }}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Promo Bar inside Mega Menu */}
                  <div
                    style={{
                      marginTop: 18,
                      padding: "10px 14px",
                      borderRadius: 6,
                      background: "#fff7ed",
                      border: "1px dashed #fdba74",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#c2410c",
                        fontWeight: 700,
                      }}
                    >
                      <Flame size={15} />
                      Cam kết 100% Chính Hãng — Giao nhanh NowFree 2H tại 186 chi nhánh toàn quốc
                    </span>
                    <Link
                      href="/deals-dang-dien-ra.html"
                      onClick={() => setMenu(false)}
                      style={{
                        fontWeight: 700,
                        color: "#ea580c",
                        textDecoration: "underline",
                      }}
                    >
                      Săn Flash Deal ngay ›
                    </Link>
                  </div>
                </div>
              )}

              {/* Right Column: Featured Brand Logos for Hovered Category */}
              {activeCategory && (
                <div
                  style={{
                    background: "#fcfdfd",
                    borderLeft: "1px solid #e5e7eb",
                    padding: "16px 14px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#226c47",
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    Thương hiệu nổi bật
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 8,
                    }}
                  >
                    {activeCategory.featuredBrands.map((brand) => (
                      <Link
                        key={brand.name}
                        href={brand.href}
                        onClick={() => setMenu(false)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 48,
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          padding: 6,
                          textDecoration: "none",
                        }}
                      >
                        {brand.logo ? (
                          <Image
                            src={brand.logo}
                            alt={brand.name}
                            width={84}
                            height={32}
                            unoptimized
                            style={{
                              maxHeight: 28,
                              width: "auto",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#226c47",
                            }}
                          >
                            {brand.name}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/thuong-hieu"
                    onClick={() => setMenu(false)}
                    style={{
                      display: "block",
                      textAlign: "center",
                      marginTop: 12,
                      padding: "7px 10px",
                      borderRadius: 5,
                      background: "#226c47",
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Xem tất cả thương hiệu ›
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {panel === "account" ? (
        <AccountDialog onClose={() => setPanel(null)} />
      ) : (
        panel === "location" && (
          <LocationDialog onClose={() => setPanel(null)} />
        )
      )}
    </>
  );
}

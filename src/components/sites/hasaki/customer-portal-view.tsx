"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Calendar,
  MapPin,
  Award,
  LogIn,
  Check,
  AlertCircle,
  Plus,
  ChevronRight,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Tag,
  Heart,
  HelpCircle,
  Copy,
  Send,
  Crown,
} from "lucide-react";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { LocationDialog } from "@/components/sites/hasaki/location-dialog";
import {
  getCustomerMenuLinks,
  getDemoOrderHistory,
  getDemoBookingHistory,
  getDemoLoyaltySummary,
  getDemoUserProfile,
  readLocation,
  clearLocation,
  formatLocationShort,
  LOCATION_CHANGE_EVENT,
  type DemoOrder,
  type DemoBooking,
  type DemoLoyaltySummary,
  type DemoUserProfile,
} from "@/lib/campaigns-location";
import { readCart, addToCart, type CartItem } from "@/lib/cart";
import { money } from "@/lib/catalog";
import {
  readAuthSession,
  saveAuthSession,
  clearAuthSession,
  fetchCurrentSession,
  DEMO_AUTH_ACCOUNTS,
  AUTH_CHANGE_EVENT,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";

interface CustomerPortalViewProps {
  initialSection?: string;
  section?: string;
}

export function CustomerPortalView({ initialSection = "tai-khoan", section }: CustomerPortalViewProps) {
  const router = useRouter();
  const targetSection = (section === "dia-chi" ? "so-dia-chi" : section) || initialSection;
  const [activeSectionState, setActiveSectionState] = useState<string | null>(null);
  const [prevTargetSection, setPrevTargetSection] = useState(targetSection);

  if (targetSection !== prevTargetSection) {
    setPrevTargetSection(targetSection);
    setActiveSectionState(targetSection);
  }

  const activeSection = activeSectionState ?? targetSection;
  const setActiveSection = (s: string) => setActiveSectionState(s);

  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [userLocationShort, setUserLocationShort] = useState<string>("Chọn khu vực của bạn");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Auth Session State (Lazy Initializer)
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(() => readAuthSession());

  // Profile form state initialized from authUser or demo profile
  const [profile, setProfile] = useState<DemoUserProfile>(() => {
    const currentAuth = readAuthSession();
    const demo = getDemoUserProfile();
    if (currentAuth) {
      return {
        ...demo,
        fullName: currentAuth.fullName || demo.fullName,
        phone: currentAuth.phone || demo.phone,
        email: currentAuth.email || demo.email,
        gender: (currentAuth.gender as DemoUserProfile["gender"]) || demo.gender,
        birthday: currentAuth.birthday || demo.birthday,
      };
    }
    return demo;
  });

  const [orders] = useState<DemoOrder[]>(getDemoOrderHistory());
  const [bookings] = useState<DemoBooking[]>(getDemoBookingHistory());
  const [loyalty] = useState<DemoLoyaltySummary>(getDemoLoyaltySummary());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  // Additional sections state
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [supportSentMsg, setSupportSentMsg] = useState<string>("");
  const [supportSubject, setSupportSubject] = useState<string>("");
  const [supportContent, setSupportContent] = useState<string>("");

  const faqs = useMemo(
    () => [
      {
        q: "Chính sách giao hàng siêu tốc NariNow 2H của Nari Home là gì?",
        a: "Dịch vụ NariNow 2H cam kết giao hàng tận nơi trong vòng 2 giờ cho các đơn hàng tại nội thành có sẵn tại chi nhánh gần bạn nhất. Đơn hàng từ 99.000₫ được hỗ trợ phí vận chuyển tối đa.",
      },
      {
        q: "Làm thế nào để đặt lịch khám bác sĩ da liễu tại Nari Clinic & Spa?",
        a: "Bạn có thể vào mục 'Lịch hẹn Clinic & Spa' hoặc bấm nút 'Đặt hẹn khám' trên thanh điều hướng. Sau đó chọn chi nhánh phòng khám, bác sĩ phụ trách, dịch vụ mong muốn và khung giờ phù hợp.",
      },
      {
        q: "Chính sách bảo hành & đổi trả 14 ngày của Nari Home được quy định ra sao?",
        a: "Nari Home cam kết đền bù 200% nếu phát hiện hàng giả. Khách hàng được đổi trả sản phẩm trong vòng 14 ngày nếu sản phẩm bị lỗi từ nhà sản xuất, dị ứng có xác nhận y tế hoặc hư hỏng do vận chuyển.",
      },
      {
        q: "Điểm Nari Rewards được tích lũy và sử dụng thế nào?",
        a: "Mỗi 10.000₫ chi tiêu tại cửa hàng hoặc phòng khám được tích 10 điểm thưởng. Điểm có thể dùng để khấu trừ trực tiếp vào đơn hàng tiếp theo (1 điểm = 10₫) hoặc đổi các voucher giảm giá đặc quyền.",
      },
    ],
    []
  );

  const [favorites, setFavorites] = useState([
    {
      sku: "102959",
      name: "Sữa Rửa Mặt CeraVe Sạch Sâu Cho Da Thường Đến Da Dầu 473ml",
      brand: "CeraVe",
      price: 395000,
      originalPrice: 470000,
      discount: "-16%",
      slug: "sua-rua-mat-cerave-sach-sau-cho-da-thuong-den-da-dau-473ml-102959.html",
      rating: 4.9,
      reviews: 1420,
      stock: "Còn hàng (NariNow 2H)",
    },
    {
      sku: "103112",
      name: "Kem Chống Nắng La Roche-Posay Anthelios Oil Correct SPF50+ 50ml",
      brand: "La Roche-Posay",
      price: 435000,
      originalPrice: 535000,
      discount: "-19%",
      slug: "kem-chong-nang-la-roche-posay-kiem-dau-50ml.html",
      rating: 4.8,
      reviews: 890,
      stock: "Còn hàng (NariNow 2H)",
    },
    {
      sku: "104520",
      name: "Nước Tẩy Trang Bioderma Sensibio H2O Cho Da Nhạy Cảm 500ml",
      brand: "Bioderma",
      price: 365000,
      originalPrice: 495000,
      discount: "-26%",
      slug: "nuoc-tay-trang-bioderma-sensibio-h2o-500ml.html",
      rating: 4.9,
      reviews: 2150,
      stock: "Còn hàng (NariNow 2H)",
    },
  ]);

  const vouchers = [
    {
      code: "NARI50K",
      title: "Giảm 50.000₫ cho đơn mỹ phẩm từ 299.000₫",
      minSpend: 299000,
      discount: "50.000 ₫",
      expiry: "31/12/2026",
      badge: "Hot Deal",
      desc: "Áp dụng toàn bộ danh mục Chăm sóc da mặt, Cơ thể và Trang điểm",
    },
    {
      code: "NARINOW 2H",
      title: "Miễn phí vận chuyển NariNow 2H toàn quốc",
      minSpend: 99000,
      discount: "Free Ship",
      expiry: "31/12/2026",
      badge: "NariNow 2H",
      desc: "Giao hàng hỏa tốc trong 2 giờ tại tất cả các quận nội thành",
    },
    {
      code: "CLINIC150K",
      title: "Giảm 150.000₫ dịch vụ Nari Clinic & Spa",
      minSpend: 500000,
      discount: "150.000 ₫",
      expiry: "31/12/2026",
      badge: "Clinic & Spa",
      desc: "Áp dụng cho dịch vụ Trị mụn chuẩn y khoa, Lấy nhân mụn và Laser CO2",
    },
    {
      code: "DIAMONDVIP",
      title: "Đặc quyền Hội viên VIP Diamond - Giảm 10%",
      minSpend: 350000,
      discount: "Giảm 10%",
      expiry: "Vô thời hạn",
      badge: "VIP Only",
      desc: "Dành riêng cho khách hàng đạt hạng thẻ Diamond trở lên",
    },
  ];

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
    }
    setCopiedVoucher(code);
    setTimeout(() => {
      setCopiedVoucher((prev) => (prev === code ? null : prev));
    }, 2500);
  };

  const handleAddToCartFromFav = (fav: typeof favorites[0]) => {
    addToCart(fav.slug, 1);
    setSaveSuccessMsg(`Đã thêm "${fav.name}" vào giỏ hàng`);
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleRemoveFavorite = (sku: string) => {
    setFavorites((prev) => prev.filter((item) => item.sku !== sku));
    setSaveSuccessMsg("Đã xóa sản phẩm khỏi danh sách yêu thích");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportContent.trim()) return;
    setSupportSentMsg("Yêu cầu hỗ trợ đã được gửi thành công! Tổng đài viên CSKH 1800 6324 sẽ liên hệ bạn sớm nhất.");
    setSupportSubject("");
    setSupportContent("");
    setTimeout(() => setSupportSentMsg(""), 5000);
  };

  const handleQuickRoleSwitch = async (acc: (typeof DEMO_AUTH_ACCOUNTS)[number]) => {
    try {
      await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: acc.username,
          password: acc.passwordHint,
        }),
      });
    } catch {
      // Ignore
    }
    saveAuthSession({
      ...acc.user,
      loggedInAt: new Date().toISOString(),
    });
    setAuthUser({
      ...acc.user,
      loggedInAt: new Date().toISOString(),
    });
    if (isStaffOrAdminRole(acc.user.role)) {
      router.push("/quan-tri");
    } else {
      router.refresh();
    }
  };

  // Sync user location & cart items & auth changes
  useEffect(() => {
    const syncData = () => {
      const loc = readLocation();
      setUserLocationShort(formatLocationShort(loc));
      setCartItems(readCart());
    };
    const handleAuthChange = () => {
      const updated = readAuthSession();
      setAuthUser(updated);
      if (updated) {
        setProfile((prev) => ({
          ...prev,
          fullName: updated.fullName || prev.fullName,
          phone: updated.phone || prev.phone,
          email: updated.email || prev.email,
          gender: (updated.gender as DemoUserProfile["gender"]) || prev.gender,
          birthday: updated.birthday || prev.birthday,
        }));
      }
    };
    syncData();
    if (!readAuthSession()) {
      fetchCurrentSession().then((u) => {
        if (u) {
          setAuthUser(u);
          setProfile((prev) => ({
            ...prev,
            fullName: u.fullName || prev.fullName,
            phone: u.phone || prev.phone,
            email: u.email || prev.email,
            gender: (u.gender as DemoUserProfile["gender"]) || prev.gender,
            birthday: u.birthday || prev.birthday,
          }));
        }
      });
    }
    window.addEventListener(LOCATION_CHANGE_EVENT, syncData);
    window.addEventListener("demo-cart-change", syncData);
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    window.addEventListener("storage", syncData);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, syncData);
      window.removeEventListener("demo-cart-change", syncData);
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      window.removeEventListener("storage", syncData);
    };
  }, []);

  const menuLinks = useMemo(() => getCustomerMenuLinks(), []);

  const isStaff = isStaffOrAdminRole(authUser?.role);
  const currentTier = authUser?.tier || loyalty.tier;
  const currentPoints =
    typeof authUser?.loyaltyPoints === "number" ? authUser.loyaltyPoints : loyalty.points;

  function handleOpenLoginModal() {
    window.dispatchEvent(new Event("hasaki-open-account"));
  }

  function handleLogout() {
    clearAuthSession();
    setAuthUser(null);
    const demo = getDemoUserProfile();
    setProfile(demo);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaveSuccessMsg("Đã cập nhật thông tin tài khoản demo thành công!");
    setTimeout(() => setSaveSuccessMsg(""), 3000);
  }

  return (
    <>
      <Header />

      <main style={{ backgroundColor: "#f5f5f5", minHeight: "100vh", paddingBottom: "60px" }}>
        {/* Breadcrumb Strip */}
        <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
          <div className="wrap" style={{ padding: "10px 0" }}>
            <nav className="breadcrumbs" aria-label="Breadcrumb" style={{ padding: 0 }}>
              <Link href="/">Trang chủ</Link>
              <span style={{ margin: "0 8px", color: "#9ca3af" }}>›</span>
              <span style={{ color: "#6b7280" }}>Khách hàng</span>
              <span style={{ margin: "0 8px", color: "#9ca3af" }}>›</span>
              <span style={{ color: "#3d2e24", fontWeight: 600 }}>
                {menuLinks.find((m) => m.key === activeSection)?.label || "Tài khoản"}
              </span>
            </nav>
          </div>
        </div>

        {/* Auth Notice & Status Banner */}
        <div className="wrap" style={{ marginTop: "14px" }}>
          {authUser ? (
            <div
              style={{
                backgroundColor: isStaff ? "#ecfdf5" : "#f0fdf4",
                border: isStaff ? "1px solid #6ee7b7" : "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: isStaff ? "#047857" : "#15803d",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "15px",
                    flexShrink: 0,
                  }}
                >
                  {(authUser.fullName || profile.fullName).charAt(0)}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ color: "#065f46", fontSize: "14px" }}>
                      Xin chào, {authUser.fullName}!
                    </strong>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        backgroundColor: isStaff ? "#d1fae5" : "#fef3c7",
                        color: isStaff ? "#065f46" : "#b45309",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      {isStaff ? authUser.roleLabel : `Hạng ${currentTier} • ${currentPoints} điểm`}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#047857" }}>
                    {authUser.email} {authUser.branchName ? `• ${authUser.branchName}` : ""}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isStaff && (
                  <Link
                    href="/quan-tri"
                    style={{
                      backgroundColor: "#3d2e24",
                      color: "#ffffff",
                      borderRadius: "4px",
                      padding: "8px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <ShieldCheck size={15} />
                    Cổng Quản Trị ERP →
                  </Link>
                )}
                <Link
                  href="/dang-nhap"
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  <LogIn size={14} />
                  Đổi tài khoản
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <LogOut size={14} />
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "12px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <div>
                  <strong style={{ color: "#92400e", fontSize: "13px" }}>
                    Chưa đăng nhập tài khoản Nari Home
                  </strong>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#78350f" }}>
                    Bạn đang xem dữ liệu hồ sơ mẫu (Gold Member). Đăng nhập để xem điểm thưởng thật, đơn hàng và lịch hẹn cá nhân.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link
                  href="/dang-nhap"
                  style={{
                    backgroundColor: "#3d2e24",
                    color: "#ffffff",
                    borderRadius: "4px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    textDecoration: "none",
                  }}
                >
                  <LogIn size={15} />
                  Đăng nhập / Đăng ký
                </Link>
                <button
                  type="button"
                  onClick={handleOpenLoginModal}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mở nhanh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Portal Body Layout: Sidebar + Main Content */}
        <div className="wrap" style={{ marginTop: "16px" }}>
          {!authUser ? (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "40px 24px",
                textAlign: "center",
                maxWidth: "560px",
                margin: "0 auto",
              }}
            >
              <User size={40} color="#3d2e24" style={{ margin: "0 auto 12px" }} />
              <h1 style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>
                Vui lòng đăng nhập để truy cập tài khoản
              </h1>
              <p style={{ fontSize: "13px", color: "#4b5563", margin: "0 0 20px", lineHeight: 1.5 }}>
                Trang thông tin cá nhân, lịch sử đơn hàng, lịch hẹn dịch vụ và sổ địa chỉ chỉ hiển thị khi bạn đã đăng nhập.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
                <Link
                  href="/dang-nhap"
                  style={{
                    backgroundColor: "#3d2e24",
                    color: "#ffffff",
                    borderRadius: "4px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Đến trang đăng nhập
                </Link>
                <button
                  type="button"
                  onClick={handleOpenLoginModal}
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#3d2e24",
                    border: "1px solid #3d2e24",
                    borderRadius: "4px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Mở hộp thoại tài khoản
                </button>
              </div>
            </div>
          ) : (
          <div className="portal-layout-grid">
            {/* Sidebar Navigation */}
            <aside
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Member Brief Card */}
              <div
                style={{
                  padding: "18px 16px",
                  borderBottom: "1px solid #f3f4f6",
                  backgroundColor: "#f9fafb",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#3d2e24",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "20px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(authUser?.fullName || profile.fullName).charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {authUser?.fullName || profile.fullName}
                  </h3>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      backgroundColor: isStaff ? "#d1fae5" : "#fef3c7",
                      color: isStaff ? "#065f46" : "#b45309",
                      padding: "2px 6px",
                      borderRadius: "10px",
                      fontSize: "11px",
                      fontWeight: 700,
                      marginTop: "3px",
                    }}
                  >
                    {isStaff ? <ShieldCheck size={12} /> : <Award size={12} />}
                    <span>{isStaff ? authUser?.roleLabel : `Thành viên ${currentTier}`}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <nav aria-label="Customer Portal Menu" style={{ padding: "8px 0" }}>
                {menuLinks.map((item) => {
                  const isActive = activeSection === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setActiveSection(item.key)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "12px 18px",
                        fontSize: "13px",
                        color: isActive ? "#3d2e24" : "#4b5563",
                        backgroundColor: isActive ? "#e8f4ed" : "transparent",
                        fontWeight: isActive ? 700 : 500,
                        borderLeft: isActive ? "4px solid #3d2e24" : "4px solid transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {item.key === "tai-khoan" && <User size={18} />}
                      {item.key === "don-hang" && <ShoppingBag size={18} />}
                      {item.key === "lich-hen" && <Calendar size={18} />}
                      {item.key === "so-dia-chi" && <MapPin size={18} />}
                      {item.key === "uu-dai" && <Tag size={18} />}
                      {item.key === "yeu-thich" && <Heart size={18} />}
                      {item.key === "hoi-dap" && <HelpCircle size={18} />}
                      {item.key === "diem-thuong" && <Award size={18} />}
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <ChevronRight size={14} color={isActive ? "#3d2e24" : "#9ca3af"} />
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Role Switcher in Sidebar */}
              <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "10px" }}>
                {isStaff && (
                  <Link
                    href="/quan-tri"
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      backgroundColor: "#f5f3ff",
                      color: "#6d28d9",
                      border: "1px solid #ddd6fe",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <Crown size={15} />
                    Hệ Thống Quản Trị ERP (/quan-tri)
                  </Link>
                )}

                <div style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Chuyển vai trò nhanh (Demo):
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {DEMO_AUTH_ACCOUNTS.map((acc) => {
                    const isCur = authUser?.role === acc.user.role && (authUser?.email === acc.user.email || authUser?.phone === acc.user.phone);
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => handleQuickRoleSwitch(acc)}
                        disabled={isCur}
                        style={{
                          padding: "6px 8px",
                          borderRadius: "4px",
                          border: isCur ? "1px solid #3d2e24" : "1px solid #e5e7eb",
                          backgroundColor: isCur ? "#e8f4ed" : "#ffffff",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: isCur ? "#3d2e24" : "#374151",
                          cursor: isCur ? "default" : "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {acc.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {authUser ? (
                  <>
                    <Link
                      href="/dang-nhap"
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        textDecoration: "none",
                      }}
                    >
                      <LogIn size={14} />
                      Đổi tài khoản khác
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b",
                        border: "1px solid #fca5a5",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <LogOut size={14} />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link
                    href="/dang-nhap"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "#3d2e24",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      textDecoration: "none",
                    }}
                  >
                    <LogIn size={14} />
                    Đăng nhập / Đăng ký
                  </Link>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                padding: "24px 28px",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                minHeight: "450px",
              }}
            >
              {/* SECTION 1: TÀI KHOẢN */}
              {activeSection === "tai-khoan" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Thông tin tài khoản
                  </h2>
                  <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#6b7280" }}>
                    Quản lý thông tin hồ sơ cá nhân và bảo mật tài khoản
                  </p>

                  {/* Summary Metric cards */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "12px",
                      marginBottom: "24px",
                    }}
                  >
                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#166534" }}>Điểm thưởng khả dụng</span>
                      <strong style={{ display: "block", fontSize: "20px", color: "#15803d", marginTop: "4px" }}>
                        {currentPoints} điểm
                      </strong>
                    </div>

                    <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", borderRadius: "6px", padding: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#92400e" }}>Hạng thành viên</span>
                      <strong style={{ display: "block", fontSize: "20px", color: "#b45309", marginTop: "4px" }}>
                        {currentTier} Member
                      </strong>
                    </div>

                    <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "6px", padding: "14px" }}>
                      <span style={{ fontSize: "12px", color: "#1e40af" }}>Đơn hàng gần đây</span>
                      <strong style={{ display: "block", fontSize: "20px", color: "#1d4ed8", marginTop: "4px" }}>
                        {orders.length} đơn
                      </strong>
                    </div>
                  </div>

                  {saveSuccessMsg && (
                    <div
                      style={{
                        padding: "10px 14px",
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "4px",
                        color: "#065f46",
                        fontSize: "13px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} style={{ display: "grid", gap: "16px", maxWidth: "600px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          Địa chỉ Email
                        </label>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          Giới tính
                        </label>
                        <select
                          value={profile.gender}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "Nam" || val === "Nữ" || val === "Khác") {
                              setProfile({ ...profile, gender: val });
                            }
                          }}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px", backgroundColor: "#fff" }}
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                          Ngày sinh
                        </label>
                        <input
                          type="date"
                          value={profile.birthday}
                          onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                          style={{ width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "13px" }}
                        />
                      </div>
                    </div>

                    <div style={{ paddingTop: "10px" }}>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: "#3d2e24",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "10px 22px",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Lưu thay đổi hồ sơ
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECTION 2: ĐƠN HÀNG */}
              {activeSection === "don-hang" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Đơn hàng của tôi
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Theo dõi trạng thái giao hàng, đơn hàng hiện tại và lịch sử mua sắm
                  </p>

                  {/* Pending Cart Items notice if any */}
                  {cartItems.length > 0 && (
                    <div
                      style={{
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "6px",
                        padding: "12px 16px",
                        marginBottom: "18px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ShoppingBag size={18} color="#059669" />
                        <span style={{ fontSize: "13px", color: "#065f46" }}>
                          Bạn đang có <strong>{cartItems.reduce((acc, i) => acc + i.quantity, 0)}</strong> sản phẩm trong giỏ hàng mẫu chưa đặt.
                        </span>
                      </div>
                      <Link
                        href="/gio-hang"
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#ffffff",
                          backgroundColor: "#3d2e24",
                          padding: "6px 14px",
                          borderRadius: "4px",
                        }}
                      >
                        Xem giỏ hàng
                      </Link>
                    </div>
                  )}

                  {/* Orders List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "16px",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        {/* Order Header */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderBottom: "1px solid #e5e7eb",
                            paddingBottom: "12px",
                            marginBottom: "12px",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>
                              {order.code}
                            </span>
                            <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "10px" }}>
                              Đặt lúc: {order.createdAt}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: order.deliveryType === "NariNow 2H" ? "#ecfdf5" : "#f3f4f6",
                                color: order.deliveryType === "NariNow 2H" ? "#047857" : "#4b5563",
                                border: order.deliveryType === "NariNow 2H" ? "1px solid #a7f3d0" : "1px solid #d1d5db",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              ⚡ {order.deliveryType}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: order.status === "Đang giao hàng" ? "#fff7ed" : "#f0fdf4",
                                color: order.status === "Đang giao hàng" ? "#c2410c" : "#15803d",
                                border: order.status === "Đang giao hàng" ? "1px solid #ffedd5" : "1px solid #bbf7d0",
                                padding: "2px 8px",
                                borderRadius: "4px",
                              }}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {order.items.map((item) => (
                            <div
                              key={item.sku}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "13px",
                              }}
                            >
                              <div>
                                <strong style={{ color: "#374151" }}>{item.brand}</strong> —{" "}
                                <Link
                                  href={`/san-pham/${item.slug}`}
                                  style={{ color: "#1f2937", textDecoration: "underline" }}
                                >
                                  {item.name}
                                </Link>
                                <span style={{ color: "#6b7280", marginLeft: "6px" }}>
                                  × {item.quantity}
                                </span>
                              </div>
                              <span style={{ fontWeight: 600, color: "#e85029" }}>
                                {money(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div
                          style={{
                            borderTop: "1px solid #e5e7eb",
                            paddingTop: "12px",
                            marginTop: "12px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                            color: "#6b7280",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div>
                            Giao tới: <strong>{order.shippingAddress}</strong>
                          </div>
                          <div>
                            Tổng thanh toán:{" "}
                            <strong style={{ fontSize: "15px", color: "#e85029" }}>
                              {money(order.total)}
                            </strong>{" "}
                            ({order.paymentMethod})
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: LỊCH HẸN CLINIC & SPA */}
              {activeSection === "lich-hen" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                        Lịch hẹn Nari Clinic & Spa
                      </h2>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Xem lịch hẹn điều trị da, tái khám bác sĩ và đặt lịch hẹn mới
                      </p>
                    </div>

                    <Link
                      href="/booking"
                      style={{
                        backgroundColor: "#3d2e24",
                        color: "#ffffff",
                        padding: "8px 14px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Plus size={15} /> Đặt lịch hẹn mới
                    </Link>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {bookings.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          padding: "16px",
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#3d2e24" }}>
                            Mã phiếu: {b.code}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              backgroundColor: b.status === "Sắp tới" ? "#ecfdf5" : "#f3f4f6",
                              color: b.status === "Sắp tới" ? "#065f46" : "#4b5563",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {b.status}
                          </span>
                        </div>

                        <h4 style={{ margin: "0 0 6px", fontSize: "15px", color: "#111827", fontWeight: 700 }}>
                          {b.serviceName}
                        </h4>

                        <div style={{ display: "grid", gap: "4px", fontSize: "13px", color: "#4b5563" }}>
                          <div>
                            <strong>Chi nhánh:</strong> {b.branchName} — {b.branchAddress}
                          </div>
                          <div>
                            <strong>Thời gian hẹn:</strong> <span style={{ color: "#e85029", fontWeight: 600 }}>{b.appointmentTime}</span>
                          </div>
                          {b.doctorAssigned && (
                            <div>
                              <strong>Bác sĩ / Kỹ thuật viên:</strong> {b.doctorAssigned}
                            </div>
                          )}
                          {b.note && (
                            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#b45309", backgroundColor: "#fef3c7", padding: "6px 10px", borderRadius: "4px" }}>
                              {b.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 4: SỔ ĐỊA CHỈ */}
              {activeSection === "so-dia-chi" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                        Sổ địa chỉ nhận hàng
                      </h2>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Quản lý địa chỉ giao hàng mặc định cho giao NariNow 2H và toàn quốc
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      style={{
                        backgroundColor: "#3d2e24",
                        color: "#ffffff",
                        padding: "8px 14px",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <MapPin size={15} /> Thay đổi khu vực
                    </button>
                  </div>

                  {/* Active selected area card */}
                  <div
                    style={{
                      border: "1px solid #bbf7d0",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span
                        style={{
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "3px",
                        }}
                      >
                        ĐỊA CHỈ MẶC ĐỊNH
                      </span>
                      <strong style={{ fontSize: "14px", color: "#166534" }}>{profile.fullName}</strong>
                      <span style={{ fontSize: "12px", color: "#4b5563" }}>({profile.phone})</span>
                    </div>

                    <p style={{ margin: "4px 0 10px", fontSize: "13px", color: "#1e293b" }}>
                      {authUser?.address || "71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình"}, {userLocationShort}
                    </p>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setShowLocationModal(true)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          backgroundColor: "#ffffff",
                          color: "#3d2e24",
                          border: "1px solid #3d2e24",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Chỉnh sửa khu vực
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clearLocation();
                          setUserLocationShort("Chọn khu vực của bạn");
                        }}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          backgroundColor: "transparent",
                          color: "#dc2626",
                          border: "1px solid #fca5a5",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Xóa địa chỉ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 5: ĐIỂM THƯỞNG */}
              {activeSection === "diem-thuong" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Điểm thưởng Nari Rewards
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Tích lũy điểm khi mua sắm mỹ phẩm và sử dụng dịch vụ Nari Clinic & Spa
                  </p>

                  {/* Loyalty Membership Card */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #1b3524 0%, #2f6a4b 50%, #4da277 100%)",
                      borderRadius: "10px",
                      padding: "20px 24px",
                      color: "#ffffff",
                      marginBottom: "20px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: "11px", letterSpacing: "1px", opacity: 0.85 }}>
                          THẺ THÀNH VIÊN Nari Rewards
                        </span>
                        <h3 style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 800 }}>
                          {currentTier} Member
                        </h3>
                        <span style={{ fontSize: "12px", opacity: 0.9 }}>
                          Mã thẻ: {authUser?.employeeCode || (authUser ? `MEM-HSK-${authUser.id}` : loyalty.memberCode)}
                        </span>
                      </div>
                      <Award size={36} color="#fbbf24" />
                    </div>

                    <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div>
                        <span style={{ fontSize: "12px", opacity: 0.85 }}>Điểm tích lũy hiện có</span>
                        <div style={{ fontSize: "28px", fontWeight: 800, color: "#fbbf24" }}>
                          {currentPoints} <span style={{ fontSize: "14px", color: "#ffffff" }}>điểm</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: "12px", opacity: 0.85 }}>
                        Cần thêm {Math.max(0, loyalty.nextTierPoints - currentPoints)} điểm để nâng hạng Diamond
                      </div>
                    </div>
                  </div>

                  {/* Tier Benefits */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                      Đặc quyền dành riêng cho hạng {currentTier}
                    </h4>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {loyalty.benefits.map((b, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            color: "#374151",
                            backgroundColor: "#f9fafb",
                            padding: "8px 12px",
                            borderRadius: "4px",
                          }}
                        >
                          <Check size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Points Transactions */}
                  <div>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginBottom: "10px" }}>
                      Lịch sử giao dịch điểm gần đây
                    </h4>
                    <div style={{ border: "1px solid #e5e7eb", borderRadius: "6px", overflow: "hidden" }}>
                      {loyalty.recentTransactions.map((tx, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 14px",
                            borderBottom: idx < loyalty.recentTransactions.length - 1 ? "1px solid #e5e7eb" : "none",
                            fontSize: "13px",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "#1f2937" }}>{tx.description}</div>
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>{tx.date}</span>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: tx.pointsChange > 0 ? "#16a34a" : "#dc2626",
                            }}
                          >
                            {tx.pointsChange > 0 ? `+${tx.pointsChange}` : tx.pointsChange} điểm
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 6: ƯU ĐÃI & MÃ GIẢM GIÁ */}
              {activeSection === "uu-dai" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Mã giảm giá & Khuyến mãi của tôi
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Các ưu đãi độc quyền dành cho đơn hàng mỹ phẩm và dịch vụ Nari Clinic & Spa
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
                    {vouchers.map((v) => (
                      <div
                        key={v.code}
                        style={{
                          border: "1px dashed #3d2e24",
                          borderRadius: "8px",
                          backgroundColor: "#f9fcf9",
                          padding: "16px",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span
                              style={{
                                backgroundColor: "#f6ece3",
                                color: "#226c47",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {v.badge}
                            </span>
                            <span style={{ fontSize: "11px", color: "#6b7280" }}>HSD: {v.expiry}</span>
                          </div>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                            {v.title}
                          </h4>
                          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 12px", lineHeight: "1.4" }}>
                            {v.desc}
                          </p>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: "#3d2e24", letterSpacing: "1px" }}>
                            {v.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(v.code)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              backgroundColor: copiedVoucher === v.code ? "#16a34a" : "#3d2e24",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              transition: "background-color 0.2s",
                            }}
                          >
                            {copiedVoucher === v.code ? <Check size={14} /> : <Copy size={14} />}
                            {copiedVoucher === v.code ? "Đã sao chép" : "Sao chép"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 7: SẢN PHẨM YÊU THÍCH */}
              {activeSection === "yeu-thich" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Danh sách sản phẩm yêu thích
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Lưu trữ các sản phẩm bạn quan tâm để dễ dàng theo dõi giá và đặt mua nhanh
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
                    {favorites.map((fav) => (
                      <div
                        key={fav.sku}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          padding: "14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: "#3d2e24", textTransform: "uppercase" }}>
                              {fav.brand}
                            </span>
                            <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700, backgroundColor: "#fee2e2", padding: "1px 6px", borderRadius: "3px" }}>
                              {fav.discount}
                            </span>
                          </div>
                          <Link
                            href={`/san-pham/${fav.slug}`}
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#111827",
                              textDecoration: "none",
                              lineHeight: "1.4",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: "8px",
                            }}
                          >
                            {fav.name}
                          </Link>
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                            <strong style={{ fontSize: "15px", color: "#e85029" }}>
                              {money(fav.price)}
                            </strong>
                            <del style={{ fontSize: "11px", color: "#9ca3af" }}>
                              {money(fav.originalPrice)}
                            </del>
                          </div>
                          <span style={{ fontSize: "11px", color: "#059669", display: "block", marginBottom: "12px" }}>
                            {fav.stock}
                          </span>
                        </div>

                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleAddToCartFromFav(fav)}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              backgroundColor: "#3d2e24",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px",
                            }}
                          >
                            <ShoppingBag size={14} />
                            Thêm vào giỏ
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFavorite(fav.sku)}
                            title="Xóa khỏi yêu thích"
                            style={{
                              padding: "8px 10px",
                              backgroundColor: "#f3f4f6",
                              color: "#6b7280",
                              border: "1px solid #d1d5db",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "11px",
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 8: HỎI ĐÁP & HỖ TRỢ */}
              {activeSection === "hoi-dap" && (
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px", color: "#1e4d36" }}>
                    Hỏi đáp & Hỗ trợ khách hàng
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Trung tâm giải đáp thắc mắc và gửi phản hồi đến bộ phận Chăm sóc khách hàng Nari Home
                  </p>

                  {/* Hotline Banner */}
                  <div
                    style={{
                      border: "1px solid #bbf7d0",
                      backgroundColor: "#f0fdf4",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#166534", margin: "0 0 2px" }}>
                        Tổng đài hỗ trợ miễn cước 1800 6324
                      </h4>
                      <p style={{ fontSize: "12px", color: "#15803d", margin: 0 }}>
                        Thời gian hoạt động từ 08:00 - 22:00 tất cả các ngày trong tuần (kể cả Thứ 7 & CN)
                      </p>
                    </div>
                    <a
                      href="tel:18006324"
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#16a34a",
                        color: "#ffffff",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 700,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      Gọi tổng đài ngay
                    </a>
                  </div>

                  {/* FAQ Accordion */}
                  <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", marginBottom: "12px" }}>
                      Câu hỏi thường gặp (FAQ)
                    </h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {faqs.map((faq, idx) => {
                        const isOpen = faqOpen === idx;
                        return (
                          <div
                            key={idx}
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "6px",
                              overflow: "hidden",
                              backgroundColor: "#ffffff",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setFaqOpen(isOpen ? null : idx)}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "12px 16px",
                                backgroundColor: isOpen ? "#f9fafb" : "#ffffff",
                                border: "none",
                                fontSize: "13px",
                                fontWeight: 700,
                                color: isOpen ? "#3d2e24" : "#1f2937",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <span>{faq.q}</span>
                              <ChevronRight
                                size={16}
                                style={{
                                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                                  transition: "transform 0.2s",
                                }}
                              />
                            </button>
                            {isOpen && (
                              <div style={{ padding: "12px 16px", fontSize: "13px", color: "#4b5563", lineHeight: "1.5", borderTop: "1px solid #f3f4f6" }}>
                                {faq.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contact Form */}
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "18px", backgroundColor: "#ffffff" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
                      Gửi yêu cầu hỗ trợ mới
                    </h3>
                    {supportSentMsg && (
                      <div style={{ marginBottom: "12px", padding: "10px 12px", backgroundColor: "#ecfdf5", color: "#065f46", fontSize: "12px", borderRadius: "4px" }}>
                        {supportSentMsg}
                      </div>
                    )}
                    <form onSubmit={handleSendSupport} style={{ display: "grid", gap: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                          Chủ đề hỗ trợ
                        </label>
                        <input
                          type="text"
                          value={supportSubject}
                          onChange={(e) => setSupportSubject(e.target.value)}
                          placeholder="Ví dụ: Cần kiểm tra lộ trình giao hàng NariNow 2H"
                          required
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "13px",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                          Nội dung yêu cầu chi tiết
                        </label>
                        <textarea
                          rows={3}
                          value={supportContent}
                          onChange={(e) => setSupportContent(e.target.value)}
                          placeholder="Mô tả cụ thể mã đơn hàng, sản phẩm hoặc vấn đề bạn cần được hỗ trợ..."
                          required
                          style={{
                            width: "100%",
                            padding: "8px 12px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            fontSize: "13px",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{
                          justifySelf: "start",
                          padding: "8px 20px",
                          backgroundColor: "#3d2e24",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Send size={14} />
                        Gửi yêu cầu hỗ trợ
                      </button>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
          )}
        </div>
      </main>

      {/* Location Selector Modal */}
      {showLocationModal && (
        <LocationDialog
          onClose={() => setShowLocationModal(false)}
          onSaved={() => {
            const loc = readLocation();
            setUserLocationShort(formatLocationShort(loc));
          }}
        />
      )}
      <Footer />
    </>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
import { readCart, type CartItem } from "@/lib/cart";
import { money } from "@/lib/catalog";
import {
  readAuthSession,
  clearAuthSession,
  fetchCurrentSession,
  AUTH_CHANGE_EVENT,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";

interface CustomerPortalViewProps {
  initialSection?: string;
  section?: string;
}

export function CustomerPortalView({ initialSection = "tai-khoan", section }: CustomerPortalViewProps) {
  const currentSection = section || initialSection;
  const [activeSection, setActiveSection] = useState<string>(currentSection);
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
              <span style={{ color: "#326e51", fontWeight: 600 }}>
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
                      backgroundColor: "#326e51",
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
                    Chưa đăng nhập tài khoản Hasaki
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
                    backgroundColor: "#326e51",
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
              <User size={40} color="#326e51" style={{ margin: "0 auto 12px" }} />
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
                    backgroundColor: "#326e51",
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
                    color: "#326e51",
                    border: "1px solid #326e51",
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
                    backgroundColor: "#326e51",
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
                        color: isActive ? "#326e51" : "#4b5563",
                        backgroundColor: isActive ? "#e8f4ed" : "transparent",
                        fontWeight: isActive ? 700 : 500,
                        borderLeft: isActive ? "4px solid #326e51" : "4px solid transparent",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {item.key === "tai-khoan" && <User size={18} />}
                      {item.key === "don-hang" && <ShoppingBag size={18} />}
                      {item.key === "lich-hen" && <Calendar size={18} />}
                      {item.key === "so-dia-chi" && <MapPin size={18} />}
                      {item.key === "diem-thuong" && <Award size={18} />}
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <ChevronRight size={14} color={isActive ? "#326e51" : "#9ca3af"} />
                    </Link>
                  );
                })}
              </nav>

              {/* Quick Actions in Sidebar */}
              <div style={{ padding: "14px 16px", borderTop: "1px solid #f3f4f6", display: "flex", flexDirection: "column", gap: "8px" }}>
                {isStaff && (
                  <Link
                    href="/quan-tri"
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "#ecfdf5",
                      color: "#065f46",
                      border: "1px solid #a7f3d0",
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
                    <ShieldCheck size={14} />
                    Vào Quản Trị ERP
                  </Link>
                )}
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
                      backgroundColor: "#326e51",
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
                          backgroundColor: "#326e51",
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
                          backgroundColor: "#326e51",
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
                                backgroundColor: order.deliveryType === "NowFree 2H" ? "#ecfdf5" : "#f3f4f6",
                                color: order.deliveryType === "NowFree 2H" ? "#047857" : "#4b5563",
                                border: order.deliveryType === "NowFree 2H" ? "1px solid #a7f3d0" : "1px solid #d1d5db",
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
                        Lịch hẹn Hasaki Clinic & Spa
                      </h2>
                      <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
                        Xem lịch hẹn điều trị da, tái khám bác sĩ và đặt lịch hẹn mới
                      </p>
                    </div>

                    <Link
                      href="/booking"
                      style={{
                        backgroundColor: "#326e51",
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
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#326e51" }}>
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
                        Quản lý địa chỉ giao hàng mặc định cho giao NowFree 2H và toàn quốc
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      style={{
                        backgroundColor: "#326e51",
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
                          color: "#326e51",
                          border: "1px solid #326e51",
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
                    Điểm thưởng Hasaki Rewards
                  </h2>
                  <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#6b7280" }}>
                    Tích lũy điểm khi mua sắm mỹ phẩm và sử dụng dịch vụ Hasaki Clinic
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
                          THẺ THÀNH VIÊN HASAKI REWARDS
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

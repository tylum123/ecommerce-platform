"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
  Calendar,
  MapPin,
  Award,
  AlertCircle,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  Tag,
  Heart,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { LocationDialog } from "@/components/sites/nari/location-dialog";
import type {
  CustomerLoyaltySummary,
  CustomerPortalBooking,
  CustomerPortalOrder,
  CustomerProfileRecord,
} from "@/lib/customer-types";
import {
  getCustomerMenuLinks,
  readLocation,
  clearLocation,
  formatLocationShort,
  LOCATION_CHANGE_EVENT,
} from "@/lib/campaigns-location";
import { readCart } from "@/lib/cart";
import { money } from "@/lib/catalog";
import { AUTH_CHANGE_EVENT, clearAuthSession } from "@/lib/auth";
import { logoutProviderSession } from "@/lib/session-capabilities";

interface CustomerPortalViewProps {
  initialSection?: string;
  section?: string;
}

function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (!Number.isFinite(d.valueOf())) return iso;
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocationShort, setUserLocationShort] = useState("Chọn khu vực của bạn");
  const [cartCount, setCartCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [profile, setProfile] = useState<CustomerProfileRecord | null>(null);
  const [orders, setOrders] = useState<CustomerPortalOrder[]>([]);
  const [bookings, setBookings] = useState<CustomerPortalBooking[]>([]);
  const [loyalty, setLoyalty] = useState<CustomerLoyaltySummary>({
    tier: "Member",
    points: 0,
    nextTier: "Silver",
    pointsToNextTier: 500,
    totalSpent: 0,
    ordersCount: 0,
  });

  const [fullNameInput, setFullNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const faqs = useMemo(
    () => [
      {
        q: "Chính sách giao hàng siêu tốc NariNow 2H của Nari Home là gì?",
        a: "Dịch vụ NariNow 2H hỗ trợ giao nhanh trong vòng 2 giờ tại các khu vực nội thành có chi nhánh hỗ trợ. Đơn từ 90.000₫ được miễn phí vận chuyển NariNow 2H.",
      },
      {
        q: "Làm thế nào để đặt lịch khám da liễu tại Nari Clinic & Spa?",
        a: "Bạn có thể vào mục Đặt hẹn tại /booking để chọn chi nhánh có phòng khám, dịch vụ và khung giờ còn trống theo thời gian thực.",
      },
      {
        q: "Tôi có thể tra cứu đơn hàng chưa đăng nhập không?",
        a: "Có, bạn có thể tra cứu trạng thái đơn hàng bằng mã đơn và số điện thoại người nhận tại /tra-cuu-don-hang.",
      },
      {
        q: "Điểm Nari Rewards được quản lý như thế nào?",
        a: "Hạng thẻ (Member, Silver, Gold, Diamond) và điểm thưởng được lưu trữ và xác thực trên máy chủ PostgreSQL.",
      },
    ],
    [],
  );

  const menuLinks = useMemo(() => getCustomerMenuLinks(), []);

  useEffect(() => {
    let cancelled = false;

    async function loadPortal() {
      setLoading(true);
      setLoadError("");
      try {
        const res = await fetch("/api/customer/portal", { cache: "no-store" });
        if (res.status === 401) {
          router.push(`/dang-nhap?redirect=/khach-hang/${encodeURIComponent(activeSection)}`);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setLoadError(data.error || "Không thể tải thông tin tài khoản lúc này.");
          return;
        }
        setProfile(data.profile);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
        if (data.loyalty) setLoyalty(data.loyalty);
        if (data.profile) {
          setFullNameInput(data.profile.fullName || "");
          setPhoneInput(data.profile.phone || "");
          setAddressInput(data.profile.defaultAddress || "");
        }
      } catch {
        if (!cancelled) {
          setLoadError("Không thể kết nối máy chủ để tải dữ liệu tài khoản.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPortal();
    return () => {
      cancelled = true;
    };
  }, [activeSection, router]);

  useEffect(() => {
    const syncLocalUi = () => {
      const loc = readLocation();
      setUserLocationShort(formatLocationShort(loc));
      setCartCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    };
    syncLocalUi();
    window.addEventListener(LOCATION_CHANGE_EVENT, syncLocalUi);
    window.addEventListener("demo-cart-change", syncLocalUi);
    window.addEventListener("storage", syncLocalUi);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, syncLocalUi);
      window.removeEventListener("demo-cart-change", syncLocalUi);
      window.removeEventListener("storage", syncLocalUi);
    };
  }, []);

  async function handleLogout() {
    try {
      await logoutProviderSession();
    } catch {
      // Ignore if session already expired
    }
    clearAuthSession();
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    router.push("/dang-nhap");
    router.refresh();
  }

  async function submitProfilePatch(patch: {
    fullName?: string;
    phone?: string;
    defaultAddress?: string;
  }) {
    setSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      const res = await fetch("/api/customer/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setSaveErrorMsg(data.error || "Không thể cập nhật thông tin.");
        return;
      }
      if (data.profile) {
        setProfile(data.profile);
        setFullNameInput(data.profile.fullName || "");
        setPhoneInput(data.profile.phone || "");
        setAddressInput(data.profile.defaultAddress || "");
      }
      setSaveSuccessMsg(data.message || "Đã lưu cập nhật hồ sơ thành công.");
    } catch {
      setSaveErrorMsg("Lỗi kết nối máy chủ khi lưu thông tin.");
    } finally {
      setSaving(false);
    }
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    void submitProfilePatch({
      fullName: fullNameInput.trim(),
      phone: phoneInput.trim(),
      defaultAddress: addressInput.trim(),
    });
  }

  function handleSaveAddress(e: FormEvent) {
    e.preventDefault();
    void submitProfilePatch({
      defaultAddress: addressInput.trim(),
    });
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#f5f5f5] pb-16">
        <div className="bg-white border-b border-gray-200">
          <div className="wrap py-2.5">
            <nav className="breadcrumbs p-0" aria-label="Breadcrumb">
              <Link href="/">Trang chủ</Link>
              <span className="mx-2 text-gray-400">›</span>
              <span className="text-gray-500">Khách hàng</span>
              <span className="mx-2 text-gray-400">›</span>
              <span className="font-semibold text-[#3d2e24]">
                {menuLinks.find((m) => m.key === activeSection)?.label || "Tài khoản"}
              </span>
            </nav>
          </div>
        </div>

        <div className="wrap mt-4">
          {profile && (
            <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#3d2e24] text-white grid place-items-center font-bold text-sm shrink-0">
                  {(profile.fullName || profile.email || "K").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-sm text-[#14532d]">
                      Xin chào, {profile.fullName || profile.email}!
                    </strong>
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Hạng {loyalty.tier} • {loyalty.points} điểm
                    </span>
                  </div>
                  <p className="text-xs text-[#166534] mt-0.5">
                    {profile.email} {profile.phone ? `• ${profile.phone}` : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-600 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#3d2e24]" />
              <span>Đang tải dữ liệu tài khoản từ máy chủ...</span>
            </div>
          )}

          {loadError && (
            <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {!loading && !loadError && profile && (
            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Sidebar */}
              <aside className="lg:col-span-3 space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                  <div className="border-b border-gray-100 bg-[#faf5f0] px-4 py-3">
                    <div className="font-bold text-sm text-[#3d2e24]">
                      {profile.fullName || "Thành viên Nari Home"}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{profile.email}</div>
                  </div>
                  <nav className="divide-y divide-gray-100">
                    {menuLinks.map((item) => {
                      const isActive = activeSection === item.key;
                      const Icon =
                        item.key === "tai-khoan"
                          ? User
                          : item.key === "don-hang"
                            ? ShoppingBag
                            : item.key === "lich-hen"
                              ? Calendar
                              : item.key === "so-dia-chi"
                                ? MapPin
                                : item.key === "uu-dai"
                                  ? Tag
                                  : item.key === "yeu-thich"
                                    ? Heart
                                    : item.key === "hoi-dap"
                                      ? HelpCircle
                                      : Award;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            setActiveSection(item.key);
                            setSaveSuccessMsg("");
                            setSaveErrorMsg("");
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium transition ${
                            isActive
                              ? "bg-[#f6ece3] text-[#3d2e24] font-bold border-l-4 border-[#3d2e24]"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Giỏ hàng hiện tại:</span>
                    <Link href="/gio-hang" className="font-bold text-[#b86b4b] underline">
                      {cartCount} sản phẩm
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Khu vực giao hàng:</span>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="font-semibold text-[#3d2e24] underline truncate max-w-[140px]"
                    >
                      {userLocationShort}
                    </button>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="lg:col-span-9 rounded-lg border border-gray-200 bg-white p-6">
                {saveSuccessMsg && (
                  <div role="status" className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-800 border border-green-200">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
                {saveErrorMsg && (
                  <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                {activeSection === "tai-khoan" && (
                  <div>
                    <h1 className="text-lg font-bold text-[#3d2e24] mb-1">Thông tin tài khoản</h1>
                    <p className="text-xs text-gray-500 mb-5">
                      Thông tin hồ sơ được lưu trực tiếp trong cơ sở dữ liệu Nari Home.
                    </p>
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email đăng nhập</label>
                        <input
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Họ và tên *</label>
                        <input
                          type="text"
                          required
                          maxLength={160}
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          pattern="(0[0-9]{9})?"
                          title="Nhập 10 chữ số bắt đầu bằng 0"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="0901234567"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Địa chỉ mặc định</label>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-[#3d2e24] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e1b18] disabled:opacity-50"
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                    </form>
                  </div>
                )}

                {activeSection === "don-hang" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h1 className="text-lg font-bold text-[#3d2e24]">Đơn hàng của tôi</h1>
                        <p className="text-xs text-gray-500">
                          Hiển thị các đơn hàng được đặt khi đã đăng nhập tài khoản này ({orders.length} đơn).
                        </p>
                      </div>
                      <Link href="/tra-cuu-don-hang" className="text-xs font-semibold text-[#b86b4b] underline">
                        Tra cứu đơn theo mã & SĐT →
                      </Link>
                    </div>

                    {orders.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 space-y-3">
                        <ShoppingBag className="w-8 h-8 mx-auto text-gray-400" />
                        <p>Bạn chưa có đơn hàng nào gắn với tài khoản này.</p>
                        <Link
                          href="/"
                          className="inline-block rounded-lg bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Khám phá sản phẩm
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div key={order.id} className="rounded-lg border border-gray-200 p-4 text-xs space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
                              <div>
                                <span className="font-mono font-bold text-sm text-[#3d2e24]">{order.orderCode}</span>
                                <span className="ml-2 text-gray-400">{formatDateTime(order.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-[#f6ece3] px-2.5 py-0.5 font-semibold text-[#3d2e24]">
                                  {order.statusLabel}
                                </span>
                                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 font-medium text-gray-700">
                                  {order.paymentStatus === "paid"
                                    ? "Đã thanh toán"
                                    : order.paymentStatus === "refunded"
                                      ? "Đã hoàn tiền"
                                      : "Chưa thanh toán"}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={`${item.sku}-${idx}`} className="flex items-center justify-between text-gray-700">
                                  <span>
                                    <b>{item.quantity}×</b> {item.name}
                                  </span>
                                  <span className="font-medium">{money(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 text-gray-600">
                              <span>
                                Giao đến: <b>{order.shippingAddress}</b> ({order.branchName})
                              </span>
                              <span className="text-sm font-bold text-[#b86b4b]">
                                Tổng: {money(order.totalAmount)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "lich-hen" && (
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <h1 className="text-lg font-bold text-[#3d2e24]">Lịch hẹn Nari Clinic & Spa</h1>
                        <p className="text-xs text-gray-500">
                          Danh sách lịch hẹn đã xác nhận trên hệ thống ({bookings.length} lịch hẹn).
                        </p>
                      </div>
                      <Link
                        href="/booking"
                        className="rounded-lg bg-[#3d2e24] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        + Đặt lịch hẹn mới
                      </Link>
                    </div>

                    {bookings.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500 space-y-3">
                        <Calendar className="w-8 h-8 mx-auto text-gray-400" />
                        <p>Bạn chưa có lịch hẹn Clinic nào gắn với tài khoản này.</p>
                        <Link
                          href="/booking"
                          className="inline-block rounded-lg bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Đặt lịch khám ngay
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {bookings.map((bk) => (
                          <div key={bk.id} className="rounded-lg border border-gray-200 p-4 text-xs space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono font-bold text-sm text-[#3d2e24]">{bk.bookingCode}</span>
                              <span className="rounded-full bg-[#f6ece3] px-2.5 py-0.5 font-semibold text-[#3d2e24]">
                                {bk.status}
                              </span>
                            </div>
                            <div className="font-semibold text-gray-900">{bk.serviceName}</div>
                            <div className="text-gray-600">
                              Thời gian: <b>{bk.date}</b> • <b>{bk.timeRange}</b> (Asia/Ho_Chi_Minh)
                            </div>
                            <div className="text-gray-600">
                              Chi nhánh: <b>{bk.branchName}</b> — {bk.branchAddress}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeSection === "so-dia-chi" && (
                  <div>
                    <h1 className="text-lg font-bold text-[#3d2e24] mb-1">Địa chỉ nhận hàng mặc định</h1>
                    <p className="text-xs text-gray-500 mb-4">
                      Lưu địa chỉ nhận hàng mặc định vào hồ sơ của bạn trên PostgreSQL.
                    </p>
                    <form onSubmit={handleSaveAddress} className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Địa chỉ giao hàng mặc định
                        </label>
                        <textarea
                          rows={3}
                          maxLength={500}
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="Ví dụ: 71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP.HCM"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-lg bg-[#3d2e24] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1e1b18] disabled:opacity-50"
                        >
                          {saving ? "Đang lưu..." : "Lưu địa chỉ mặc định"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Chọn khu vực giao hàng ({userLocationShort})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearLocation();
                            setUserLocationShort("Chọn khu vực của bạn");
                          }}
                          className="text-xs text-gray-500 underline"
                        >
                          Xóa khu vực đã lưu
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeSection === "diem-thuong" && (
                  <div className="space-y-4">
                    <h1 className="text-lg font-bold text-[#3d2e24]">Hạng thẻ & Điểm thưởng Nari Rewards</h1>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-amber-200 bg-[#faf5f0] p-4">
                        <div className="text-xs text-gray-500">Hạng thành viên hiện tại</div>
                        <div className="mt-1 text-2xl font-bold text-[#3d2e24]">{loyalty.tier}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          {loyalty.nextTier
                            ? `Cần thêm ${loyalty.pointsToNextTier} điểm để lên hạng ${loyalty.nextTier}`
                            : "Bạn đang ở hạng thành viên cao nhất"}
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs text-gray-500">Điểm thưởng khả dụng</div>
                        <div className="mt-1 text-2xl font-bold text-[#b86b4b]">{loyalty.points} điểm</div>
                      </div>
                      <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <div className="text-xs text-gray-500">Tổng chi tiêu ({loyalty.ordersCount} đơn)</div>
                        <div className="mt-1 text-2xl font-bold text-gray-900">{money(loyalty.totalSpent)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "uu-dai" && (
                  <div className="space-y-3">
                    <h1 className="text-lg font-bold text-[#3d2e24]">Mã giảm giá & Khuyến mãi</h1>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-[#faf5f0] p-6 text-sm text-gray-700 space-y-2">
                      <p>
                        Ví mã giảm giá cá nhân hóa đang chờ kích hoạt đồng bộ máy chủ. Bạn có thể xem các chương trình ưu đãi đang mở trên trang Nari Deals.
                      </p>
                      <Link
                        href="/deals-dang-dien-ra.html"
                        className="inline-block rounded-lg bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-white"
                      >
                        Xem Nari Deals đang diễn ra →
                      </Link>
                    </div>
                  </div>
                )}

                {activeSection === "yeu-thich" && (
                  <div className="space-y-3">
                    <h1 className="text-lg font-bold text-[#3d2e24]">Sản phẩm yêu thích</h1>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-[#faf5f0] p-6 text-sm text-gray-700 space-y-2">
                      <p>
                        Danh sách yêu thích lưu trên máy chủ đang được hoàn thiện. Bạn có thể kiểm tra giỏ hàng hoặc tiếp tục xem sản phẩm chính hãng.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/gio-hang"
                          className="inline-block rounded-lg bg-[#3d2e24] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Xem giỏ hàng ({cartCount})
                        </Link>
                        <Link
                          href="/"
                          className="inline-block rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700"
                        >
                          Khám phá sản phẩm
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "hoi-dap" && (
                  <div className="space-y-5">
                    <div>
                      <h1 className="text-lg font-bold text-[#3d2e24]">Hỏi đáp & Hỗ trợ khách hàng</h1>
                      <p className="text-xs text-gray-500 mt-1">
                        Tổng đài CSKH miễn phí: <b>1800 6324</b> · Email: <b>cskh@narihome.vn</b>
                      </p>
                    </div>

                    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                      {faqs.map((item, idx) => (
                        <div key={item.q} className="p-4">
                          <button
                            type="button"
                            onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                            className="w-full text-left text-xs font-bold text-[#3d2e24] flex items-center justify-between gap-2"
                          >
                            <span>{item.q}</span>
                            <span>{faqOpen === idx ? "−" : "+"}</span>
                          </button>
                          {faqOpen === idx && <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.a}</p>}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-lg bg-[#faf5f0] border border-[#e6d5c5] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-[#3d2e24]">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span>Cần hỗ trợ thêm về đơn hàng hoặc bảo hành? Xem trang Trung tâm Hỗ trợ Nari Home.</span>
                      </div>
                      <Link href="/ho-tro" className="font-semibold text-[#b86b4b] underline">
                        Mở Trung tâm Hỗ trợ →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      {showLocationModal && <LocationDialog onClose={() => setShowLocationModal(false)} />}
    </>
  );
}

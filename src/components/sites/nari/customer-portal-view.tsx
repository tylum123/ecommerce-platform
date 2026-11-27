"use client";

import { useState, useEffect, useMemo, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShoppingBag,
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
  ChevronRight,
  ChevronDown,
  Crown,
  Sparkles,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { LocationDialog } from "@/components/sites/nari/location-dialog";
import {
  EmptyStateCard,
  KpiStatCard,
  SectionCard,
  StatusBadge,
  type StatusTone,
} from "@/components/sites/nari/portal/portal-ui";
import type {
  CustomerLoyaltySummary,
  CustomerPortalOrder,
  CustomerProfileRecord,
} from "@/lib/customer-types";
import type { ErpOrderStatus, PaymentStatus, UserTier } from "@/lib/erp-types";
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

interface TierMilestone {
  tier: UserTier;
  rangeLabel: string;
  minPoints: number;
  benefit: string;
}

const TIER_MILESTONES: readonly TierMilestone[] = [
  {
    tier: "Member",
    rangeLabel: "0 – 499 điểm",
    minPoints: 0,
    benefit: "Tích điểm tự động trên mỗi đơn hàng chính hãng tại Nari Home.",
  },
  {
    tier: "Silver",
    rangeLabel: "500 – 1.499 điểm",
    minPoints: 500,
    benefit: "Ưu tiên xử lý đơn hàng và nhận thông báo sớm các đợt Nari Deals.",
  },
  {
    tier: "Gold",
    rangeLabel: "1.500 – 2.999 điểm",
    minPoints: 1500,
    benefit: "Đặc quyền quà tặng định kỳ và hỗ trợ ưu tiên giao nhanh NariNow 2H.",
  },
  {
    tier: "Diamond",
    rangeLabel: "Từ 3.000 điểm",
    minPoints: 3000,
    benefit: "Hạng thành viên cao nhất với đặc quyền chăm sóc khách hàng VIP.",
  },
];

const TIER_BADGE_STYLES: Record<UserTier, string> = {
  Member: "border-[#d8b89c]/40 bg-white/10 text-[#f6ece3]",
  Silver: "border-slate-200/40 bg-slate-100/15 text-slate-100",
  Gold: "border-amber-300/50 bg-amber-300/20 text-amber-200",
  Diamond: "border-[#e6d5c5]/60 bg-[#9e7656]/35 text-[#fff7ed]",
};

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

function getOrderStatusTone(status: ErpOrderStatus): StatusTone {
  switch (status) {
    case "delivered":
      return "success";
    case "cancelled":
    case "returned":
      return "danger";
    case "pending":
      return "warning";
    case "confirmed":
    case "packing":
    case "shipping":
      return "info";
    default:
      return "neutral";
  }
}

function getPaymentStatusMeta(paymentStatus: PaymentStatus): { label: string; tone: StatusTone } {
  if (paymentStatus === "paid") {
    return { label: "Đã thanh toán", tone: "success" };
  }
  if (paymentStatus === "refunded") {
    return { label: "Đã hoàn tiền", tone: "warning" };
  }
  return { label: "Chưa thanh toán", tone: "neutral" };
}

function getTierProgress(loyalty: CustomerLoyaltySummary): {
  percent: number;
  targetPoints: number | null;
} {
  if (!loyalty.nextTier) {
    return { percent: 100, targetPoints: null };
  }
  const targetPoints =
    loyalty.tier === "Member"
      ? 500
      : loyalty.tier === "Silver"
        ? 1500
        : loyalty.tier === "Gold"
          ? 3000
          : null;
  if (!targetPoints) {
    return { percent: 100, targetPoints: null };
  }
  const startPoints =
    loyalty.tier === "Member" ? 0 : loyalty.tier === "Silver" ? 500 : 1500;
  const span = Math.max(1, targetPoints - startPoints);
  const ratio = (loyalty.points - startPoints) / span;
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return { percent, targetPoints };
}

function getMenuIcon(key: string) {
  switch (key) {
    case "tai-khoan":
      return User;
    case "don-hang":
      return ShoppingBag;
    case "so-dia-chi":
      return MapPin;
    case "uu-dai":
      return Tag;
    case "yeu-thich":
      return Heart;
    case "hoi-dap":
      return HelpCircle;
    default:
      return Award;
  }
}

export function CustomerPortalView({ initialSection = "tai-khoan", section }: CustomerPortalViewProps) {
  const router = useRouter();
  const normalizedSection =
    section === "dia-chi" ? "so-dia-chi" : section === "lich-hen" ? "don-hang" : section;
  const targetSection = normalizedSection || initialSection;
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
  const [cancellingOrderCode, setCancellingOrderCode] = useState<string | null>(null);
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
  const tierProgress = useMemo(() => getTierProgress(loyalty), [loyalty]);

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

  async function handleCancelOrder(order: CustomerPortalOrder) {
    if (order.status !== "pending" || cancellingOrderCode) return;
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${order.orderCode}?`)) return;

    setCancellingOrderCode(order.orderCode);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          orderCode: order.orderCode,
          phone: order.recipientPhone,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setSaveErrorMsg(data?.error || "Không thể hủy đơn hàng lúc này.");
        return;
      }
      setOrders((prev) =>
        prev.map((item) =>
          item.orderCode === order.orderCode
            ? { ...item, status: "cancelled", statusLabel: "Đã hủy đơn" }
            : item,
        ),
      );
      setSaveSuccessMsg(`Đã hủy đơn hàng ${order.orderCode} thành công.`);
    } catch {
      setSaveErrorMsg("Lỗi kết nối máy chủ khi hủy đơn hàng.");
    } finally {
      setCancellingOrderCode(null);
    }
  }

  function handleSelectSection(key: string) {
    setActiveSection(key);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");
  }

  const activeSectionLabel =
    menuLinks.find((m) => m.key === activeSection)?.label || "Tài khoản";

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#faf5f0] pb-16 overflow-x-clip">
        {/* Breadcrumb */}
        <div className="border-b border-[#e6d5c5] bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <nav
              className="flex items-center gap-1.5 text-xs text-[#7c685c] overflow-x-auto whitespace-nowrap"
              aria-label="Breadcrumb"
            >
              <Link href="/" className="transition hover:text-[#3d2e24]">
                Trang chủ
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#b8a394]" />
              <span>Khách hàng</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#b8a394]" />
              <span className="font-semibold text-[#3d2e24]">{activeSectionLabel}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
          {loading && (
            <div className="rounded-2xl border border-[#e6d5c5] bg-white p-10 text-center text-sm text-[#6e5a4f] shadow-[0_2px_14px_rgba(61,46,36,0.04)] flex items-center justify-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-[#9e7656]" />
              <span>Đang tải dữ liệu tài khoản từ máy chủ...</span>
            </div>
          )}

          {loadError && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 flex items-center gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          {!loading && !loadError && profile && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
              {/* Sidebar & Mobile Top Member Card + Pill Tabs */}
              <aside className="lg:col-span-4 xl:col-span-3 space-y-4 min-w-0">
                {/* Nari Rewards Membership Card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#9e7656]/35 bg-gradient-to-br from-[#3d2e24] via-[#2f231b] to-[#1e1b18] p-5 text-[#faf5f0] shadow-[0_10px_28px_rgba(30,27,24,0.18)]">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#9e7656]/20 blur-2xl"
                  />
                  <div className="relative space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8b89c]/40 bg-[#9e7656]/25 text-sm font-bold text-[#faf5f0]">
                          {(profile.fullName || profile.email || "K").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-white">
                            {profile.fullName || "Thành viên Nari Home"}
                          </div>
                          <div className="truncate text-[11px] text-[#d9c5b2]">
                            {profile.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleLogout()}
                        aria-label="Đăng xuất"
                        className="lg:hidden inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-[#f6ece3] transition hover:bg-white/20 shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Thoát</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${TIER_BADGE_STYLES[loyalty.tier]}`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Nari {loyalty.tier}</span>
                      </span>
                      <div className="text-right">
                        <span className="text-lg font-bold tracking-tight text-white">
                          {loyalty.points.toLocaleString("vi-VN")}
                        </span>
                        <span className="ml-1 text-[11px] text-[#d9c5b2]">điểm</span>
                      </div>
                    </div>

                    {/* Tier Upgrade Progress */}
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#d8b89c] to-[#b86b4b] transition-all duration-500"
                          style={{ width: `${tierProgress.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-[#d9c5b2]">
                        {loyalty.nextTier ? (
                          <>
                            <span>
                              Cần thêm{" "}
                              <strong className="text-white">
                                {loyalty.pointsToNextTier.toLocaleString("vi-VN")}
                              </strong>{" "}
                              điểm
                            </span>
                            <span className="font-medium text-[#f6ece3]">
                              Hạng {loyalty.nextTier}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#f6ece3]">
                            <Sparkles className="w-3 h-3" />
                            Bạn đang ở hạng thành viên cao nhất
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Horizontal Pill Navigation */}
                <nav
                  aria-label="Điều hướng cổng khách hàng"
                  className="lg:hidden -mx-4 px-4 overflow-x-auto pb-1"
                >
                  <div className="flex items-center gap-2 w-max">
                    {menuLinks.map((item) => {
                      const isActive = activeSection === item.key;
                      const Icon = getMenuIcon(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSelectSection(item.key)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium whitespace-nowrap transition ${
                            isActive
                              ? "border-[#3d2e24] bg-[#3d2e24] text-white shadow-sm"
                              : "border-[#e6d5c5] bg-white text-[#5c493e] hover:border-[#d8b89c] hover:bg-[#f6ece3]/60"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* Desktop Sidebar Navigation */}
                <div className="hidden lg:block overflow-hidden rounded-2xl border border-[#e6d5c5] bg-white shadow-[0_2px_14px_rgba(61,46,36,0.04)]">
                  <nav aria-label="Menu tài khoản" className="divide-y divide-[#f3e8dd]">
                    {menuLinks.map((item) => {
                      const isActive = activeSection === item.key;
                      const Icon = getMenuIcon(item.key);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSelectSection(item.key)}
                          className={`w-full flex items-center justify-between gap-2.5 px-4 py-3 text-left text-xs transition ${
                            isActive
                              ? "bg-[#f6ece3] text-[#3d2e24] font-semibold border-l-[3px] border-[#b86b4b]"
                              : "text-[#5c493e] font-medium hover:bg-[#faf5f0]"
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? "text-[#b86b4b]" : "text-[#8f7a6c]"
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.key === "don-hang" && orders.length > 0 && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5c493e] border border-[#e6d5c5]">
                              {orders.length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="border-t border-[#efe2d4] bg-[#faf5f0]/60 p-3">
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#e6d5c5] bg-white px-3 py-2 text-xs font-semibold text-[#7c3a2d] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>

                {/* Quick Utility Summary (Desktop) */}
                <div className="hidden lg:block rounded-2xl border border-[#e6d5c5] bg-white p-4 text-xs space-y-3 shadow-[0_2px_14px_rgba(61,46,36,0.04)]">
                  <div className="flex items-center justify-between gap-2 text-[#6e5a4f]">
                    <span>Giỏ hàng hiện tại</span>
                    <Link
                      href="/gio-hang"
                      className="font-semibold text-[#b86b4b] hover:underline"
                    >
                      {cartCount} sản phẩm
                    </Link>
                  </div>
                  <div className="h-px bg-[#f3e8dd]" />
                  <div className="flex items-center justify-between gap-2 text-[#6e5a4f]">
                    <span className="shrink-0">Khu vực giao hàng</span>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="font-semibold text-[#3d2e24] hover:text-[#b86b4b] underline truncate max-w-[140px]"
                    >
                      {userLocationShort}
                    </button>
                  </div>
                </div>
              </aside>

              {/* Main Content */}
              <div className="lg:col-span-8 xl:col-span-9 space-y-5 min-w-0">
                {saveSuccessMsg && (
                  <div
                    role="status"
                    className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs font-medium text-emerald-800"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}
                {saveErrorMsg && (
                  <div
                    role="alert"
                    className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs font-medium text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{saveErrorMsg}</span>
                  </div>
                )}

                {activeSection === "tai-khoan" && (
                  <SectionCard
                    title="Thông tin tài khoản"
                    description="Thông tin hồ sơ được lưu trực tiếp trong cơ sở dữ liệu Nari Home."
                  >
                    <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                      <div>
                        <label
                          htmlFor="portal-email"
                          className="block text-xs font-semibold text-[#5c493e] mb-1.5"
                        >
                          Email đăng nhập
                        </label>
                        <input
                          id="portal-email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full rounded-xl border border-[#e6d5c5] bg-[#faf5f0] px-3.5 py-2.5 text-sm text-[#7c685c] cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="portal-fullname"
                          className="block text-xs font-semibold text-[#5c493e] mb-1.5"
                        >
                          Họ và tên *
                        </label>
                        <input
                          id="portal-fullname"
                          type="text"
                          required
                          maxLength={160}
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="Nhập họ và tên của bạn"
                          className="w-full rounded-xl border border-[#d9c5b2] bg-white px-3.5 py-2.5 text-sm text-[#1e1b18] placeholder:text-[#9c887b] transition focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="portal-phone"
                          className="block text-xs font-semibold text-[#5c493e] mb-1.5"
                        >
                          Số điện thoại
                        </label>
                        <input
                          id="portal-phone"
                          type="tel"
                          inputMode="numeric"
                          pattern="(0[0-9]{9})?"
                          title="Nhập 10 chữ số bắt đầu bằng 0"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="0901234567"
                          className="w-full rounded-xl border border-[#d9c5b2] bg-white px-3.5 py-2.5 text-sm text-[#1e1b18] placeholder:text-[#9c887b] transition focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="portal-address"
                          className="block text-xs font-semibold text-[#5c493e] mb-1.5"
                        >
                          Địa chỉ mặc định
                        </label>
                        <textarea
                          id="portal-address"
                          rows={3}
                          maxLength={500}
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                          className="w-full rounded-xl border border-[#d9c5b2] bg-white px-3.5 py-2.5 text-sm text-[#1e1b18] placeholder:text-[#9c887b] transition focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25"
                        />
                      </div>

                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="inline-flex items-center justify-center rounded-xl bg-[#3d2e24] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
                        >
                          {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </form>
                  </SectionCard>
                )}

                {activeSection === "don-hang" && (
                  <SectionCard
                    title="Đơn hàng của tôi"
                    description={`Hiển thị các đơn hàng được đặt khi đã đăng nhập tài khoản này (${orders.length} đơn).`}
                    actions={
                      <Link
                        href="/tra-cuu-don-hang"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#e6d5c5] bg-white px-3 py-1.5 text-xs font-semibold text-[#b86b4b] transition hover:border-[#d8b89c] hover:bg-[#faf5f0]"
                      >
                        <span>Tra cứu đơn theo mã & SĐT</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    }
                  >
                    {orders.length === 0 ? (
                      <EmptyStateCard
                        icon={<ShoppingBag className="w-6 h-6" />}
                        title="Chưa có đơn hàng nào"
                        description="Bạn chưa có đơn hàng nào gắn với tài khoản này. Khám phá các sản phẩm mỹ phẩm chính hãng tại Nari Home."
                        action={
                          <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-xl bg-[#3d2e24] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1e1b18]"
                          >
                            Khám phá sản phẩm
                          </Link>
                        }
                      />
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => {
                          const paymentMeta = getPaymentStatusMeta(order.paymentStatus);
                          return (
                            <article
                              key={order.id}
                              className="rounded-2xl border border-[#e6d5c5] bg-white p-4 sm:p-5 space-y-3.5 transition hover:border-[#d8b89c]"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f3e8dd] pb-3">
                                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                  <span className="font-mono text-sm font-bold text-[#3d2e24]">
                                    {order.orderCode}
                                  </span>
                                  <span className="text-xs text-[#7c685c]">
                                    {formatDateTime(order.createdAt)}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <StatusBadge tone={getOrderStatusTone(order.status)}>
                                    {order.statusLabel}
                                  </StatusBadge>
                                  <StatusBadge tone={paymentMeta.tone}>
                                    {paymentMeta.label}
                                  </StatusBadge>
                                </div>
                              </div>

                              <div className="rounded-xl bg-[#faf5f0]/70 px-3.5 py-2.5 divide-y divide-[#efe2d4]">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={`${item.sku}-${idx}`}
                                    className="flex items-start justify-between gap-3 py-1.5 text-xs text-[#3d2e24]"
                                  >
                                    <span className="min-w-0 leading-relaxed">
                                      <strong className="font-semibold text-[#b86b4b]">
                                        {item.quantity}×
                                      </strong>{" "}
                                      {item.name}
                                    </span>
                                    <span className="shrink-0 font-semibold text-[#3d2e24]">
                                      {money(item.price * item.quantity)}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                                <div className="flex items-start gap-1.5 text-[#6e5a4f] min-w-0">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#9e7656]" />
                                  <span className="leading-relaxed">
                                    Giao đến:{" "}
                                    <strong className="font-semibold text-[#3d2e24]">
                                      {order.shippingAddress}
                                    </strong>{" "}
                                    ({order.branchName})
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2.5 ml-auto">
                                  <Link
                                    href="/tra-cuu-don-hang"
                                    className="inline-flex items-center gap-1 rounded-xl border border-[#d9c5b2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5c493e] transition hover:border-[#9e7656] hover:bg-[#faf5f0]"
                                  >
                                    <span>Tra cứu chi tiết</span>
                                  </Link>

                                  {order.status === "pending" && (
                                    <button
                                      type="button"
                                      disabled={cancellingOrderCode === order.orderCode}
                                      onClick={() => void handleCancelOrder(order)}
                                      className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                      {cancellingOrderCode === order.orderCode
                                        ? "Đang hủy..."
                                        : "Hủy đơn"}
                                    </button>
                                  )}

                                  <span className="text-sm font-bold text-[#b86b4b] pl-1">
                                    {money(order.totalAmount)}
                                  </span>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                )}

                {activeSection === "so-dia-chi" && (
                  <SectionCard
                    title="Địa chỉ nhận hàng mặc định"
                    description="Lưu địa chỉ nhận hàng mặc định vào hồ sơ của bạn trên PostgreSQL."
                  >
                    <form onSubmit={handleSaveAddress} className="space-y-4 max-w-xl">
                      <div>
                        <label
                          htmlFor="portal-default-address"
                          className="block text-xs font-semibold text-[#5c493e] mb-1.5"
                        >
                          Địa chỉ giao hàng mặc định
                        </label>
                        <textarea
                          id="portal-default-address"
                          rows={3}
                          maxLength={500}
                          value={addressInput}
                          onChange={(e) => setAddressInput(e.target.value)}
                          placeholder="Ví dụ: 71 Hoàng Hoa Thám, Phường 13, Quận Tân Bình, TP.HCM"
                          className="w-full rounded-xl border border-[#d9c5b2] bg-white px-3.5 py-2.5 text-sm text-[#1e1b18] placeholder:text-[#9c887b] transition focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <button
                          type="submit"
                          disabled={saving}
                          className="rounded-xl bg-[#3d2e24] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
                        >
                          {saving ? "Đang lưu..." : "Lưu địa chỉ mặc định"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowLocationModal(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#d9c5b2] bg-[#faf5f0] px-4 py-2.5 text-xs font-semibold text-[#3d2e24] transition hover:border-[#9e7656] hover:bg-[#f6ece3]"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#b86b4b]" />
                          <span>Khu vực: {userLocationShort}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearLocation();
                            setUserLocationShort("Chọn khu vực của bạn");
                          }}
                          className="px-2 py-1 text-xs font-medium text-[#7c685c] underline transition hover:text-[#3d2e24]"
                        >
                          Xóa khu vực đã lưu
                        </button>
                      </div>
                    </form>
                  </SectionCard>
                )}

                {activeSection === "diem-thuong" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <KpiStatCard
                        label="Điểm hiện có"
                        value={`${loyalty.points.toLocaleString("vi-VN")} điểm`}
                        hint={
                          loyalty.nextTier
                            ? `Cần thêm ${loyalty.pointsToNextTier.toLocaleString("vi-VN")} điểm lên hạng ${loyalty.nextTier}`
                            : "Bạn đang ở hạng cao nhất"
                        }
                        icon={<Award className="w-4 h-4" />}
                        tone="accent"
                      />
                      <KpiStatCard
                        label="Tổng chi tiêu"
                        value={money(loyalty.totalSpent)}
                        hint="Tính trên các đơn hàng hợp lệ"
                        icon={<ShoppingBag className="w-4 h-4" />}
                      />
                      <KpiStatCard
                        label="Số đơn hợp lệ"
                        value={`${loyalty.ordersCount} đơn`}
                        hint="Không bao gồm đơn hủy hoặc hoàn trả"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      />
                    </div>

                    <SectionCard
                      title="Bảng mốc hạng thẻ Nari Rewards"
                      description="Điểm tích lũy và hạng thành viên được đồng bộ trực tiếp từ hệ thống Nari Home."
                    >
                      <div className="divide-y divide-[#efe2d4] rounded-xl border border-[#e6d5c5] overflow-hidden">
                        {TIER_MILESTONES.map((milestone) => {
                          const isCurrent = loyalty.tier === milestone.tier;
                          return (
                            <div
                              key={milestone.tier}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-3.5 ${
                                isCurrent ? "bg-[#f6ece3]/70" : "bg-white"
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-[#3d2e24]">
                                    {milestone.tier}
                                  </span>
                                  <span className="text-xs font-medium text-[#9e7656]">
                                    {milestone.rangeLabel}
                                  </span>
                                  {isCurrent && (
                                    <StatusBadge tone="accent">Hạng hiện tại</StatusBadge>
                                  )}
                                </div>
                                <p className="text-xs text-[#6e5a4f] leading-relaxed">
                                  {milestone.benefit}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SectionCard>
                  </div>
                )}

                {activeSection === "uu-dai" && (
                  <SectionCard
                    title="Mã giảm giá & Khuyến mãi"
                    description="Tổng hợp chương trình ưu đãi chính hãng dành cho thành viên Nari Home."
                  >
                    <EmptyStateCard
                      icon={<Tag className="w-6 h-6" />}
                      title="Ví mã giảm giá cá nhân hóa đang chờ đồng bộ"
                      description="Ví mã giảm giá cá nhân hóa đang chờ kích hoạt đồng bộ máy chủ. Bạn có thể xem các chương trình ưu đãi đang mở trên trang Nari Deals."
                      action={
                        <Link
                          href="/deals-dang-dien-ra.html"
                          className="inline-flex items-center justify-center rounded-xl bg-[#3d2e24] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1e1b18]"
                        >
                          Xem Nari Deals đang diễn ra →
                        </Link>
                      }
                    />
                  </SectionCard>
                )}

                {activeSection === "yeu-thich" && (
                  <SectionCard
                    title="Sản phẩm yêu thích"
                    description="Lưu giữ các sản phẩm mỹ phẩm bạn quan tâm để mua sắm nhanh hơn."
                  >
                    <EmptyStateCard
                      icon={<Heart className="w-6 h-6" />}
                      title="Danh sách yêu thích đang được hoàn thiện"
                      description="Danh sách yêu thích lưu trên máy chủ đang được hoàn thiện. Bạn có thể kiểm tra giỏ hàng hoặc tiếp tục xem sản phẩm chính hãng."
                      action={
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <Link
                            href="/gio-hang"
                            className="inline-flex items-center justify-center rounded-xl bg-[#3d2e24] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#1e1b18]"
                          >
                            Xem giỏ hàng ({cartCount})
                          </Link>
                          <Link
                            href="/"
                            className="inline-flex items-center justify-center rounded-xl border border-[#d9c5b2] bg-white px-5 py-2.5 text-xs font-semibold text-[#3d2e24] transition hover:border-[#9e7656] hover:bg-[#faf5f0]"
                          >
                            Khám phá sản phẩm
                          </Link>
                        </div>
                      }
                    />
                  </SectionCard>
                )}

                {activeSection === "hoi-dap" && (
                  <SectionCard
                    title="Hỏi đáp & Hỗ trợ khách hàng"
                    description="Giải đáp nhanh các thắc mắc về giao hàng NariNow 2H, đơn hàng và Nari Rewards."
                  >
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/70 px-4 py-3 text-xs text-[#5c493e]">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#b86b4b]" />
                          Tổng đài CSKH miễn phí: <strong className="text-[#3d2e24]">1800 6324</strong>
                        </span>
                        <span className="hidden sm:inline text-[#d8b89c]">•</span>
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#b86b4b]" />
                          Email: <strong className="text-[#3d2e24]">cskh@narihome.io.vn</strong>
                        </span>
                      </div>

                      <div className="divide-y divide-[#efe2d4] rounded-2xl border border-[#e6d5c5] overflow-hidden">
                        {faqs.map((item, idx) => {
                          const isOpen = faqOpen === idx;
                          return (
                            <div key={item.q} className="bg-white">
                              <button
                                type="button"
                                onClick={() => setFaqOpen(isOpen ? null : idx)}
                                aria-expanded={isOpen}
                                className="w-full px-4 py-3.5 text-left text-xs font-semibold text-[#3d2e24] flex items-center justify-between gap-3 transition hover:bg-[#faf5f0]/60"
                              >
                                <span>{item.q}</span>
                                <ChevronDown
                                  className={`w-4 h-4 shrink-0 text-[#9e7656] transition-transform duration-200 ${
                                    isOpen ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              {isOpen && (
                                <p className="px-4 pb-4 text-xs text-[#6e5a4f] leading-relaxed">
                                  {item.a}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="rounded-2xl border border-[#e6d5c5] bg-[#faf5f0] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-[#3d2e24]">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-[#b86b4b]" />
                          <span>
                            Cần hỗ trợ thêm về đơn hàng hoặc đổi trả? Xem trang Trung tâm Hỗ trợ Nari Home.
                          </span>
                        </div>
                        <Link
                          href="/ho-tro"
                          className="font-semibold text-[#b86b4b] hover:underline whitespace-nowrap"
                        >
                          Mở Trung tâm Hỗ trợ →
                        </Link>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* Compact Mobile Quick Summary */}
                <div className="lg:hidden rounded-2xl border border-[#e6d5c5] bg-white p-4 text-xs space-y-2.5 shadow-[0_2px_14px_rgba(61,46,36,0.04)]">
                  <div className="flex items-center justify-between gap-2 text-[#6e5a4f]">
                    <span>Giỏ hàng hiện tại</span>
                    <Link href="/gio-hang" className="font-semibold text-[#b86b4b] hover:underline">
                      {cartCount} sản phẩm
                    </Link>
                  </div>
                  <div className="h-px bg-[#f3e8dd]" />
                  <div className="flex items-center justify-between gap-2 text-[#6e5a4f]">
                    <span className="shrink-0">Khu vực giao hàng</span>
                    <button
                      type="button"
                      onClick={() => setShowLocationModal(true)}
                      className="font-semibold text-[#3d2e24] underline truncate max-w-[180px]"
                    >
                      {userLocationShort}
                    </button>
                  </div>
                </div>
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

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  readAuthSession,
  saveAuthSession,
  clearAuthSession,
  fetchCurrentSession,
  isStaffOrAdminRole,
  DEMO_AUTH_ACCOUNTS,
  AUTH_CHANGE_EVENT,
  type AuthSessionUser,
} from "@/lib/auth";
import {
  X,
  UserRound,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Crown,
  Sparkles,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Truck,
  Stethoscope,
  Store,
  Headphones,
  ShoppingBag,
  Calendar,
  MapPin,
  Tag,
  Heart,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";

export function AccountDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [authUser, setAuthUser] = useState<AuthSessionUser | null>(() => readAuthSession());

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleAuthChange = () => setAuthUser(readAuthSession());
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    // Refresh auth from server without wiping client session
    fetchCurrentSession().then((u) => {
      if (u) setAuthUser(u);
    });
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  const closeDialog = () => {
    if (dialog.current?.open) {
      dialog.current.close();
    }
    onClose();
  };

  const handleLogin = async (loginUser = username, loginPass = password) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMessage("Vui lòng nhập tài khoản và mật khẩu");
      return;
    }

    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginUser.trim(),
          password: loginPass.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Đăng nhập không thành công");
        return;
      }

      const user: AuthSessionUser = data.user;
      saveAuthSession(user);
      setAuthUser(user);
      setSuccessMessage(`Đăng nhập thành công: ${user.fullName}`);

      setTimeout(() => {
        closeDialog();
        startTransition(() => {
          if (isStaffOrAdminRole(user.role)) {
            router.push("/quan-tri");
          } else {
            router.push("/khach-hang/tai-khoan");
          }
          router.refresh();
        });
      }, 400);
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ");
    }
  };

  const handleRegister = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim() || !regPhone.trim() || !regPassword.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ họ tên, số điện thoại và mật khẩu");
      return;
    }

    if (regPhone.trim().length < 10) {
      setErrorMessage("Số điện thoại tối thiểu 10 chữ số");
      return;
    }

    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: regPhone.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Đăng ký không thành công");
        return;
      }

      const user: AuthSessionUser = data.user;
      saveAuthSession(user);
      setAuthUser(user);
      setSuccessMessage("Đăng ký thành công!");

      setTimeout(() => {
        closeDialog();
        startTransition(() => {
          router.push("/khach-hang/tai-khoan");
          router.refresh();
        });
      }, 400);
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ");
    }
  };

  const handleQuickSwitch = async (acc: (typeof DEMO_AUTH_ACCOUNTS)[number]) => {
    setUsername(acc.username);
    setPassword(acc.passwordHint);
    await handleLogin(acc.username, acc.passwordHint);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth?action=logout", { method: "POST" });
    } catch {
      // Ignore
    }
    clearAuthSession();
    setAuthUser(null);
    closeDialog();
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-5 w-5 text-purple-600" />;
      case "store_manager":
        return <Store className="h-5 w-5 text-blue-600" />;
      case "warehouse_staff":
        return <Truck className="h-5 w-5 text-orange-600" />;
      case "clinic_doctor":
        return <Stethoscope className="h-5 w-5 text-[#3d2e24]" />;
      case "cs_agent":
        return <Headphones className="h-5 w-5 text-teal-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <dialog
      ref={dialog}
      onCancel={closeDialog}
      onClose={closeDialog}
      className="m-auto w-[min(94vw,520px)] rounded-2xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/60 overflow-hidden"
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8faf9] px-6 py-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#3d2e24]" />
          <h2 className="text-base font-bold text-[#3d2e24] tracking-tight">
            {authUser ? "TÀI KHOẢN & PHÂN QUYỀN" : "ĐĂNG NHẬP / ĐĂNG KÝ NARI HOME"}
          </h2>
        </div>
        <button
          type="button"
          onClick={closeDialog}
          aria-label="Đóng cửa sổ"
          className="rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[80vh] overflow-y-auto p-6 space-y-5">
        {/* State 1: User is Logged In */}
        {authUser ? (
          <div className="space-y-5">
            {/* User Profile Card */}
            <div className="rounded-xl border border-[#e6d5c5] bg-gradient-to-br from-[#faf5f0] to-[#f6ece3] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#3d2e24] text-white shadow-sm">
                  {getRoleIcon(authUser.role)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-bold text-gray-900">{authUser.fullName}</p>
                    <span className="rounded-full bg-[#3d2e24] text-white px-2.5 py-0.5 text-[11px] font-bold">
                      {authUser.roleLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {authUser.phone || authUser.email}
                    {authUser.branchName ? ` • ${authUser.branchName}` : ""}
                  </p>
                  {authUser.tier && (
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Hạng {authUser.tier}
                      </span>
                      <span className="text-gray-600">
                        <b>{authUser.loyaltyPoints || 0}</b> Điểm Nari Rewards
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Accessible Screens Section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Các màn hình có thể hiển thị theo phân quyền
                </h3>
                <span className="text-[11px] font-medium text-[#3d2e24]">
                  {isStaffOrAdminRole(authUser.role) ? "ERP & Cổng khách hàng" : "Cổng khách hàng"}
                </span>
              </div>

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm text-sm overflow-hidden">
                {/* Admin ERP route (for staff & admin roles) */}
                {isStaffOrAdminRole(authUser.role) ? (
                  <Link
                    href="/quan-tri"
                    onClick={closeDialog}
                    className="flex items-center justify-between p-3 font-semibold text-purple-700 bg-purple-50/70 hover:bg-purple-100 transition"
                  >
                    <span className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4 text-purple-700" />
                      <span>Hệ Thống Quản Trị ERP Nari Home</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-purple-600 font-bold">
                      Truy cập ERP <ChevronRight className="h-4 w-4" />
                    </span>
                  </Link>
                ) : (
                  <Link
                    href="/quan-tri"
                    onClick={closeDialog}
                    className="flex items-center justify-between p-3 text-xs text-gray-500 hover:bg-gray-50 transition"
                    title="Khách hàng vào /quan-tri sẽ hiển thị màn hình phân quyền & chuyển đổi vai trò"
                  >
                    <span className="flex items-center gap-2.5">
                      <Crown className="h-4 w-4 text-gray-400" />
                      <span>Hệ Thống Quản Trị ERP (/quan-tri)</span>
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      Yêu cầu quyền Staff/Admin
                    </span>
                  </Link>
                )}

                {/* Customer Portal Screens */}
                <Link
                  href="/khach-hang/tai-khoan"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <UserRound className="h-4 w-4 text-[#3d2e24]" />
                    <span>Thông tin tài khoản cá nhân</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/don-hang"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <ShoppingBag className="h-4 w-4 text-[#3d2e24]" />
                    <span>Đơn hàng của tôi (Theo dõi NariNow 2H)</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/lich-hen"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-[#3d2e24]" />
                    <span>Lịch hẹn Clinic & Spa</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/so-dia-chi"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#3d2e24]" />
                    <span>Sổ địa chỉ nhận hàng</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/uu-dai"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Tag className="h-4 w-4 text-[#3d2e24]" />
                    <span>Mã giảm giá & Khuyến mãi của tôi</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/yeu-thich"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Danh sách sản phẩm yêu thích</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>

                <Link
                  href="/khach-hang/hoi-dap"
                  onClick={closeDialog}
                  className="flex items-center justify-between p-3 text-gray-700 hover:bg-[#faf5f0]/60 hover:text-[#3d2e24] transition"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-[#3d2e24]" />
                    <span>Hỏi đáp & Hỗ trợ khách hàng</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Quick Demo Role Switcher */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Chuyển đổi vai trò nhanh (1-Click Demo)
                </h3>
                <span className="text-[11px] text-gray-400">Không cần đăng nhập lại</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_AUTH_ACCOUNTS.map((acc) => {
                  const isCurrent =
                    acc.user.role === authUser.role &&
                    (acc.user.phone === authUser.phone || acc.user.email === authUser.email);

                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickSwitch(acc)}
                      disabled={isPending || isCurrent}
                      className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                        isCurrent
                          ? "border-[#3d2e24] bg-[#fbf0ea] ring-1 ring-[#3d2e24]"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="shrink-0">{getRoleIcon(acc.user.role)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-xs font-bold text-gray-800">{acc.badge}</p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-[#3d2e24]">Hiện tại</span>
                          )}
                        </div>
                        <p className="truncate text-[10px] text-gray-500">{acc.user.fullName}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        ) : (
          /* State 2: User is Not Logged In */
          <div className="space-y-4">
            {/* Tab switch */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 pb-3 text-center text-sm font-bold transition ${
                  activeTab === "login"
                    ? "border-b-2 border-[#3d2e24] text-[#3d2e24]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ĐĂNG NHẬP
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 pb-3 text-center text-sm font-bold transition ${
                  activeTab === "register"
                    ? "border-b-2 border-[#3d2e24] text-[#3d2e24]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ĐĂNG KÝ
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {activeTab === "login" ? (
              /* Login Tab Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại hoặc Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="0901234567 hoặc admin@narihome.vn"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-xs focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                      required
                    />
                    <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-xs focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                      required
                    />
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-xs font-bold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý đăng nhập..." : "ĐĂNG NHẬP"}
                </button>

                {/* 1-Click Demo Logins for All 6 Roles */}
                <div className="pt-2">
                  <div className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Đăng nhập nhanh 1-Click theo vai trò:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_AUTH_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => handleQuickSwitch(acc)}
                        disabled={isPending}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-[#fbfdfc] p-2 text-left transition hover:border-[#3d2e24] hover:bg-[#f6ece3]"
                      >
                        <div className="shrink-0">{getRoleIcon(acc.user.role)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[11px] font-bold text-gray-800">{acc.badge}</p>
                          <p className="truncate text-[10px] text-gray-500">{acc.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-gray-500">
                  <Link
                    href="/dang-nhap"
                    onClick={closeDialog}
                    className="text-[#3d2e24] hover:underline font-semibold"
                  >
                    Xem trang đăng nhập đầy đủ ›
                  </Link>
                </div>
              </form>
            ) : (
              /* Register Tab Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegister();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-xs focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                      required
                    />
                    <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Ví dụ: 0901234567"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-xs focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                      required
                    />
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mật khẩu tối thiểu 6 ký tự"
                      className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-xs focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                      required
                    />
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-xs font-bold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : "ĐĂNG KÝ NGAY"}
                </button>

                <div className="pt-2 text-center text-xs text-gray-500">
                  <Link
                    href="/dang-ky"
                    onClick={closeDialog}
                    className="text-[#3d2e24] hover:underline font-semibold"
                  >
                    Xem trang đăng ký đầy đủ ›
                  </Link>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}


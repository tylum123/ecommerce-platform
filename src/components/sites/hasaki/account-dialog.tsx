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
    if (!readAuthSession()) {
      fetchCurrentSession().then((u) => {
        if (u) setAuthUser(u);
      });
    }
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
      setSuccessMessage(`Đăng nhập thành công! Chào ${user.fullName}`);

      setTimeout(() => {
        closeDialog();
        if (isStaffOrAdminRole(user.role)) {
          router.push("/quan-tri");
        }
      }, 500);
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
        router.push("/khach-hang/tai-khoan");
      }, 500);
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ");
    }
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

  return (
    <dialog
      ref={dialog}
      onCancel={closeDialog}
      onClose={closeDialog}
      className="m-auto w-[min(92vw,460px)] rounded-xl border border-gray-200 bg-white p-0 shadow-2xl backdrop:bg-black/50 overflow-hidden"
    >
      {/* Header Modal */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-[#f8faf9] px-6 py-4">
        <h2 className="text-base font-bold text-[#326e51]">
          {authUser ? "TÀI KHOẢN CỦA BẠN" : "XÁC THỰC TÀI KHOẢN"}
        </h2>
        <button
          type="button"
          onClick={closeDialog}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-6">
        {/* State 1: User is Logged In */}
        {authUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#326e51] text-white">
                {isStaffOrAdminRole(authUser.role) ? (
                  <Crown className="h-6 w-6" />
                ) : (
                  <UserRound className="h-6 w-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-gray-900">{authUser.fullName}</p>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {authUser.roleLabel}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{authUser.phone || authUser.email}</p>
                {authUser.tier && (
                  <p className="text-[11px] font-medium text-amber-700">
                    Hạng {authUser.tier} • {authUser.loyaltyPoints || 0} Điểm Hasaki
                  </p>
                )}
              </div>
            </div>

            <div className="divide-y divide-gray-100 text-sm">
              {isStaffOrAdminRole(authUser.role) && (
                <Link
                  href="/quan-tri"
                  onClick={closeDialog}
                  className="flex items-center justify-between py-2.5 font-semibold text-purple-700 hover:text-purple-900"
                >
                  <span className="flex items-center gap-2">
                    <Crown className="h-4 w-4" /> Hệ Thống Quản Trị ERP
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                href="/khach-hang/tai-khoan"
                onClick={closeDialog}
                className="flex items-center justify-between py-2.5 text-gray-700 hover:text-[#326e51]"
              >
                <span>Thông tin cá nhân</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                href="/khach-hang/don-hang"
                onClick={closeDialog}
                className="flex items-center justify-between py-2.5 text-gray-700 hover:text-[#326e51]"
              >
                <span>Lịch sử đơn hàng</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                href="/khach-hang/dia-chi"
                onClick={closeDialog}
                className="flex items-center justify-between py-2.5 text-gray-700 hover:text-[#326e51]"
              >
                <span>Sổ địa chỉ</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất tài khoản
              </button>
            </div>
          </div>
        ) : (
          /* State 2: User is Not Logged In */
          <div>
            {/* Tab switch */}
            <div className="mb-4 flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 pb-2.5 text-center text-sm font-bold transition ${
                  activeTab === "login"
                    ? "border-b-2 border-[#326e51] text-[#326e51]"
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
                className={`flex-1 pb-2.5 text-center text-sm font-bold transition ${
                  activeTab === "register"
                    ? "border-b-2 border-[#326e51] text-[#326e51]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                ĐĂNG KÝ
              </button>
            </div>

            {errorMessage && (
              <div className="mb-3 flex items-center gap-2 rounded bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-3 flex items-center gap-2 rounded bg-green-50 p-2.5 text-xs text-green-700">
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
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Số điện thoại / email"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-[#326e51] focus:outline-none focus:ring-1 focus:ring-[#326e51]"
                      required
                    />
                    <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mật khẩu"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-xs focus:border-[#326e51] focus:outline-none focus:ring-1 focus:ring-[#326e51]"
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
                  className="w-full rounded-lg bg-[#326e51] py-2.5 text-xs font-bold text-white transition hover:bg-[#25553e] disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : "ĐĂNG NHẬP"}
                </button>

                {/* 1-Click Demo Logins */}
                <div className="pt-2">
                  <div className="mb-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Đăng nhập nhanh 1-Click:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUsername("admin@hasaki.vn");
                        setPassword("Hasaki@123");
                        handleLogin("admin@hasaki.vn", "Hasaki@123");
                      }}
                      className="flex items-center gap-1.5 rounded border border-purple-200 bg-purple-50 p-2 text-left text-xs text-purple-900 transition hover:bg-purple-100"
                    >
                      <Crown className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-[11px]">Admin ERP</div>
                        <div className="text-[10px] text-purple-600 truncate">admin@hasaki.vn</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUsername("0901234567");
                        setPassword("Hasaki@123");
                        handleLogin("0901234567", "Hasaki@123");
                      }}
                      className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 p-2 text-left text-xs text-amber-900 transition hover:bg-amber-100"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-[11px]">Khách VIP</div>
                        <div className="text-[10px] text-amber-600 truncate">0901234567</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center text-xs text-gray-500">
                  <Link
                    href="/dang-nhap"
                    onClick={closeDialog}
                    className="text-[#326e51] hover:underline font-medium"
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
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Họ và tên"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-[#326e51] focus:outline-none focus:ring-1 focus:ring-[#326e51]"
                      required
                    />
                    <UserRound className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-xs focus:border-[#326e51] focus:outline-none focus:ring-1 focus:ring-[#326e51]"
                      required
                    />
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-xs focus:border-[#326e51] focus:outline-none focus:ring-1 focus:ring-[#326e51]"
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
                  className="w-full rounded-lg bg-[#326e51] py-2.5 text-xs font-bold text-white transition hover:bg-[#25553e] disabled:opacity-50"
                >
                  {isPending ? "Đang xử lý..." : "ĐĂNG KÝ NGAY"}
                </button>

                <div className="pt-2 text-center text-xs text-gray-500">
                  <Link
                    href="/dang-ky"
                    onClick={closeDialog}
                    className="text-[#326e51] hover:underline font-medium"
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

"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import {
  saveAuthSession,
  DEMO_AUTH_ACCOUNTS,
  isStaffOrAdminRole,
  type AuthSessionUser,
} from "@/lib/auth";
import {
  ShieldCheck,
  UserRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Crown,
  Sparkles,
  Truck,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "";
  const initialError = searchParams.get("error");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    initialError === "login_required"
      ? "Vui lòng đăng nhập để truy cập trang tài khoản"
      : initialError === "unauthorized"
        ? "Vui lòng đăng nhập với tài khoản Quản trị để vào hệ thống ERP"
        : ""
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = async (loginUser = username, loginPass = password) => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginUser.trim() || !loginPass.trim()) {
      setErrorMessage("Vui lòng nhập số điện thoại/email và mật khẩu");
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
      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${user.fullName}`);

      // Determine redirect destination
      let destination = redirectTarget;
      if (!destination) {
        destination = isStaffOrAdminRole(user.role) ? "/quan-tri" : "/khach-hang/tai-khoan";
      }

      startTransition(() => {
        router.push(destination);
        router.refresh();
      });
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
    }
  };

  const handleDemoClick = (acc: (typeof DEMO_AUTH_ACCOUNTS)[number]) => {
    setUsername(acc.username);
    setPassword(acc.passwordHint);
    handleLogin(acc.username, acc.passwordHint);
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#b86b4b]">
          Trang chủ
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">Đăng nhập tài khoản</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left column: Login form */}
        <div className="md:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-xl font-bold text-[#3d2e24]">ĐĂNG NHẬP</h1>
            <p className="mt-1 text-xs text-gray-500">
              Nhập số điện thoại/email và mật khẩu để đăng nhập tài khoản Nari Home
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số điện thoại hoặc Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: 0901234567 hoặc admin@narihome.vn"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <UserRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-sm">
                <label className="font-medium text-gray-700">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <Link
                  href="/dang-nhap"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Quên mật khẩu: Hãy sử dụng mật khẩu mặc định 'Nari@123' cho tài khoản demo.");
                  }}
                  className="text-xs text-[#b86b4b] hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
            >
              {isPending ? "Đang xử lý đăng nhập..." : "ĐĂNG NHẬP"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-sm text-gray-600">
              Bạn chưa có tài khoản?{" "}
              <Link href="/dang-ky" className="font-semibold text-[#b86b4b] hover:underline">
                Đăng ký ngay tại đây
              </Link>
            </p>
          </div>
        </div>

        {/* Right column: 1-Click Demo Accounts */}
        <div className="md:col-span-5 rounded-xl border border-gray-200 bg-[#fbf8f5] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">1-CLICK ĐĂNG NHẬP DEMO</h2>
          </div>
          <p className="mb-4 text-xs text-gray-600">
            Dành cho đánh giá & kiểm thử nhanh. Nhấn vào một tài khoản bên dưới để tự động đăng nhập và trải nghiệm toàn diện hệ thống:
          </p>

          <div className="space-y-3">
            {DEMO_AUTH_ACCOUNTS.map((acc) => {
              const isAdmin = acc.user.role === "admin";
              const isCustomer = acc.user.role === "customer";
              const isWarehouse = acc.user.role === "warehouse_staff";

              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleDemoClick(acc)}
                  disabled={isPending}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-[#3d2e24] hover:shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Crown className="h-4 w-4 text-purple-600" />
                      ) : isWarehouse ? (
                        <Truck className="h-4 w-4 text-orange-600" />
                      ) : isCustomer ? (
                        <Sparkles className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Stethoscope className="h-4 w-4 text-[#3d2e24]" />
                      )}
                      <span className="text-xs font-bold text-gray-800">{acc.label}</span>
                    </div>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        isAdmin
                          ? "bg-purple-100 text-purple-700"
                          : isWarehouse
                            ? "bg-orange-100 text-orange-700"
                            : isCustomer
                              ? "bg-amber-100 text-amber-800"
                              : "bg-[#f6ece3] text-[#3d2e24]"
                      }`}
                    >
                      {acc.badge}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      User: <b>{acc.username}</b>
                    </span>
                    <span className="flex items-center gap-1 text-[#b86b4b] font-medium">
                      Đăng nhập <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-lg bg-[#faf5f0] p-3 text-xs text-[#2a1f18]">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Chính sách xác thực thống nhất</span>
            </div>
            <p className="mt-1 text-[11px] text-[#3d2e24]">
              Sử dụng Cookie HttpOnly signed HMAC-SHA256 <code className="font-mono">hasaki_session</code>, tương thích App Router và Middleware phân quyền RBAC.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DangNhapPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#faf5f0] py-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl p-8 text-center text-sm text-gray-500">
              Đang tải trang đăng nhập...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import {
  saveAuthSession,
  DEMO_AUTH_ACCOUNTS,
  type AuthSessionUser,
} from "@/lib/auth";
import {
  ShieldCheck,
  UserRound,
  Phone,
  Mail,
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

function RegisterForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleRegister = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim() || !phone.trim() || !password.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ Họ tên, Số điện thoại và Mật khẩu");
      return;
    }

    if (phone.trim().length < 10) {
      setErrorMessage("Số điện thoại không hợp lệ (tối thiểu 10 chữ số)");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const res = await fetch("/api/auth?action=register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Đăng ký không thành công");
        return;
      }

      const user: AuthSessionUser = data.user;
      saveAuthSession(user);
      setSuccessMessage("Đăng ký thành công! Đang chuyển hướng vào tài khoản...");

      startTransition(() => {
        router.push("/khach-hang/tai-khoan");
        router.refresh();
      });
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
    }
  };

  const handleDemoClick = async (acc: (typeof DEMO_AUTH_ACCOUNTS)[number]) => {
    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: acc.username,
          password: acc.passwordHint,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        saveAuthSession(data.user);
        startTransition(() => {
          router.push(acc.user.role === "admin" ? "/quan-tri" : "/khach-hang/tai-khoan");
          router.refresh();
        });
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#b86b4b]">
          Trang chủ
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">Đăng ký tài khoản</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left column: Registration form */}
        <div className="md:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-xl font-bold text-[#3d2e24]">ĐĂNG KÝ TÀI KHOẢN</h1>
            <p className="mt-1 text-xs text-gray-500">
              Tạo tài khoản Nari Home để nhận ngay 50 điểm thưởng Loyalty và ưu đãi NariNow 2H
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
              handleRegister();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <UserRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email (không bắt buộc)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: an.nguyen@gmail.com"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)..."
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

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-sm font-semibold text-white transition hover:bg-[#1e1b18] disabled:opacity-50"
            >
              {isPending ? "Đang xử lý đăng ký..." : "ĐĂNG KÝ TÀI KHOẢN"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4 text-center">
            <p className="text-sm text-gray-600">
              Bạn đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="font-semibold text-[#b86b4b] hover:underline">
                Đăng nhập ngay tại đây
              </Link>
            </p>
          </div>
        </div>

        {/* Right column: 1-Click Demo Accounts */}
        <div className="md:col-span-5 rounded-xl border border-gray-200 bg-[#fbf8f5] p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-base font-bold text-gray-800">1-CLICK TÀI KHOẢN DEMO</h2>
          </div>
          <p className="mb-4 text-xs text-gray-600">
            Bạn không cần đăng ký nếu muốn trải nghiệm thử ngay lập tức. Nhấn một tài khoản demo bên dưới để bắt đầu:
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
              <span>Bảo mật & Quyền riêng tư</span>
            </div>
            <p className="mt-1 text-[11px] text-[#3d2e24]">
              Thông tin đăng ký được lưu trữ bảo mật trong cơ sở dữ liệu PostgreSQL, cấp quyền RBAC vai trò Thành Viên (Member) có điểm thưởng tích lũy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DangKyPage() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#faf5f0] py-8">
        <Suspense
          fallback={
            <div className="mx-auto max-w-5xl p-8 text-center text-sm text-gray-500">
              Đang tải trang đăng ký...
            </div>
          }
        >
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

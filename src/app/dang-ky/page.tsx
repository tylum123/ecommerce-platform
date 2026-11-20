"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { AUTH_CHANGE_EVENT } from "@/lib/auth";
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
  Sparkles,
  Award,
  ShoppingBag,
  Calendar,
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
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRegister = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setRequiresConfirmation(false);

    if (fullName.trim().length < 2 || !email.trim() || !password) {
      setErrorMessage("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.");
      return;
    }

    if (phone.trim() && !/^0\d{9}$/.test(phone.trim())) {
      setErrorMessage("Số điện thoại không hợp lệ (gồm 10 chữ số bắt đầu bằng 0).");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có tối thiểu 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMessage(data.error || "Đăng ký không thành công.");
        return;
      }

      if (data.requiresEmailConfirmation) {
        setRequiresConfirmation(true);
        setSuccessMessage(
          data.message ||
            "Đăng ký thành công! Vui lòng kiểm tra hộp thư email và bấm liên kết xác thực trước khi đăng nhập.",
        );
        setPassword("");
        setConfirmPassword("");
        return;
      }

      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      setSuccessMessage("Đăng ký thành công! Đang chuyển hướng vào tài khoản...");
      startTransition(() => {
        router.push("/khach-hang/tai-khoan");
        router.refresh();
      });
    } catch {
      setErrorMessage("Lỗi kết nối máy chủ, vui lòng thử lại sau.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#b86b4b]">
          Trang chủ
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-medium">Đăng ký tài khoản</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        <div className="md:col-span-7 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h1 className="text-xl font-bold text-[#3d2e24]">ĐĂNG KÝ TÀI KHOẢN NARI HOME</h1>
            <p className="mt-1 text-xs text-gray-500">
              Tạo tài khoản khách hàng để theo dõi đơn hàng, lịch hẹn Nari Clinic & Spa và tích điểm Nari Rewards
            </p>
          </div>

          {errorMessage && (
            <div role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMessage}</span>
              </div>
              {requiresConfirmation && (
                <div className="mt-2 pl-7">
                  <Link href="/dang-nhap" className="font-semibold text-[#3d2e24] underline">
                    Đi đến trang đăng nhập →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleRegister();
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
                  maxLength={160}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <UserRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: an.nguyen@gmail.com"
                  maxLength={254}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0901234567"
                  pattern="(0[0-9]{9})?"
                  title="Nhập 10 chữ số bắt đầu bằng 0"
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                />
                <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)..."
                  minLength={8}
                  maxLength={128}
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-[#3d2e24] focus:outline-none focus:ring-1 focus:ring-[#3d2e24]"
                  required
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu..."
                  minLength={8}
                  maxLength={128}
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

          <div className="mt-6 border-t border-gray-100 pt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Bạn đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="font-semibold text-[#b86b4b] hover:underline">
                Đăng nhập ngay tại đây
              </Link>
            </p>
            <p className="text-xs text-gray-500">
              <Link href="/khoi-phuc-mat-khau" className="hover:underline">
                Quên mật khẩu? Khôi phục qua email
              </Link>
            </p>
          </div>
        </div>

        <div className="md:col-span-5 rounded-xl border border-gray-200 bg-[#fbf8f5] p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Sparkles className="h-5 w-5 text-[#b86b4b]" />
            <h2 className="text-base font-bold text-[#3d2e24]">QUYỀN LỢI THÀNH VIÊN NARI HOME</h2>
          </div>

          <ul className="space-y-3 text-xs text-gray-700">
            <li className="flex items-start gap-2.5 rounded-lg bg-white p-3 border border-gray-100">
              <ShoppingBag className="h-4 w-4 shrink-0 text-[#3d2e24] mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Theo dõi đơn hàng NariNow 2H</p>
                <p className="text-gray-500 mt-0.5">
                  Lưu địa chỉ nhận hàng mặc định và xem toàn bộ lịch sử đơn hàng trực tiếp tại Cổng Khách Hàng.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 rounded-lg bg-white p-3 border border-gray-100">
              <Calendar className="h-4 w-4 shrink-0 text-[#3d2e24] mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Quản lý lịch hẹn Nari Clinic & Spa</p>
                <p className="text-gray-500 mt-0.5">
                  Xem lại lịch khám da liễu và liệu trình đã đặt theo từng chi nhánh phòng khám.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 rounded-lg bg-white p-3 border border-gray-100">
              <Award className="h-4 w-4 shrink-0 text-[#3d2e24] mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Hạng thẻ & Nari Rewards</p>
                <p className="text-gray-500 mt-0.5">
                  Tích lũy điểm thưởng và nâng hạng Member, Silver, Gold, Diamond minh bạch từ máy chủ.
                </p>
              </div>
            </li>
          </ul>

          <div className="rounded-lg bg-[#f6ece3] p-3 text-xs text-[#2a1f18]">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Bảo mật Supabase Auth & PostgreSQL</span>
            </div>
            <p className="mt-1 text-[11px] text-[#3d2e24]">
              Tài khoản được xác thực qua Supabase Auth và hồ sơ được bảo vệ bằng Row-Level Security (RLS). Mọi người đăng ký công khai đều mang vai trò Thành viên chuẩn.
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
        <RegisterForm />
      </main>
      <Footer />
    </>
  );
}

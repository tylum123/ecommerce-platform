"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { AuthShell } from "@/components/sites/nari/auth-shell";
import { AUTH_CHANGE_EVENT } from "@/lib/auth";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  UserRound,
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const busy = isSubmitting || isPending;

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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-sm text-emerald-900"
        >
          <div className="flex items-start gap-2.5 font-medium">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
          {requiresConfirmation && (
            <div className="mt-2.5 pl-6">
              <Link
                href="/dang-nhap"
                className="font-semibold text-[#3d2e24] underline transition-colors hover:text-[#b86b4b]"
              >
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
          <label htmlFor="register-fullname" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
            Họ và tên <span className="text-[#b86b4b]">*</span>
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
              aria-hidden="true"
            />
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ví dụ: Nguyễn Văn An"
              maxLength={160}
              disabled={busy}
              className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Email <span className="text-[#b86b4b]">*</span>
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="an.nguyen@gmail.com"
                maxLength={254}
                disabled={busy}
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="register-phone" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Số điện thoại <span className="text-xs font-normal text-[#6e5a4f]">(tùy chọn)</span>
            </label>
            <div className="relative">
              <Phone
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="register-phone"
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                pattern="(0[0-9]{9})?"
                title="Nhập 10 chữ số bắt đầu bằng 0"
                disabled={busy}
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
            Mật khẩu <span className="text-[#b86b4b]">*</span>
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
              aria-hidden="true"
            />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
              minLength={8}
              maxLength={128}
              disabled={busy}
              className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-11 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              disabled={busy}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6e5a4f] transition-colors hover:text-[#3d2e24] disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="register-confirm-password" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
            Xác nhận mật khẩu <span className="text-[#b86b4b]">*</span>
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
              aria-hidden="true"
            />
            <input
              id="register-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              minLength={8}
              maxLength={128}
              disabled={busy}
              className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-semibold text-[#faf5f0] transition-colors hover:bg-[#2a1f18] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          <span>{busy ? "Đang xử lý đăng ký..." : "Đăng ký tài khoản"}</span>
        </button>
      </form>

      <div className="mt-6 space-y-2 border-t border-[#efe3d7] pt-5 text-center">
        <p className="text-sm text-[#6e5a4f]">
          Bạn đã có tài khoản?{" "}
          <Link href="/dang-nhap" className="font-semibold text-[#b86b4b] transition-colors hover:text-[#3d2e24] hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
        <p className="text-xs text-[#6e5a4f]">
          <Link href="/khoi-phuc-mat-khau" className="transition-colors hover:text-[#3d2e24] hover:underline">
            Quên mật khẩu? Khôi phục qua email
          </Link>
        </p>
      </div>
    </>
  );
}

export default function DangKyPage() {
  return (
    <>
      <Header />
      <AuthShell
        breadcrumbLabel="Đăng ký tài khoản"
        title="Đăng ký tài khoản Nari Home"
        subtitle="Tạo tài khoản thành viên để theo dõi đơn hàng NariNow 2H, lưu địa chỉ giao nhận và tích điểm Nari Rewards."
      >
        <RegisterForm />
      </AuthShell>
      <Footer />
    </>
  );
}

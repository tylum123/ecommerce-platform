"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export function PasswordRecoveryClient({ isResetMode }: { isResetMode: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRequestReset(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Không thể gửi yêu cầu khôi phục mật khẩu.");
        return;
      }
      setMessage(data.message || "Nếu email đã đăng ký, hệ thống đã gửi liên kết đặt lại mật khẩu.");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdatePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Mật khẩu mới phải từ 8 đến 128 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/recovery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Không thể đặt lại mật khẩu. Vui lòng yêu cầu liên kết mới.");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setMessage(data.message || "Đặt lại mật khẩu thành công.");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
          <span className="font-medium">{message}</span>
        </div>
      )}

      {isResetMode ? (
        <form onSubmit={(e) => void handleUpdatePassword(e)} className="space-y-4">
          <div>
            <label htmlFor="recovery-password" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="recovery-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-11 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
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
            <label htmlFor="recovery-confirm-password" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="recovery-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-semibold text-[#faf5f0] transition-colors hover:bg-[#2a1f18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</span>
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleRequestReset(e)} className="space-y-4">
          <div>
            <label htmlFor="recovery-email" className="mb-1.5 block text-sm font-medium text-[#3d2e24]">
              Email tài khoản
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]"
                aria-hidden="true"
              />
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="ten-cua-ban@email.com"
                className="w-full rounded-xl border border-[#e6d5c5] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9e8c80] transition-all focus:border-[#9e7656] focus:outline-none focus:ring-2 focus:ring-[#9e7656]/25 disabled:bg-[#faf5f0] disabled:opacity-70"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-5 py-3 text-sm font-semibold text-[#faf5f0] transition-colors hover:bg-[#2a1f18] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            <span>{busy ? "Đang gửi liên kết..." : "Gửi liên kết khôi phục"}</span>
          </button>
        </form>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efe3d7] pt-5 text-sm">
        <Link href="/dang-nhap" className="font-semibold text-[#b86b4b] transition-colors hover:text-[#3d2e24] hover:underline">
          ← Quay lại đăng nhập
        </Link>
        <Link href="/dang-ky" className="text-[#6e5a4f] transition-colors hover:text-[#3d2e24] hover:underline">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}

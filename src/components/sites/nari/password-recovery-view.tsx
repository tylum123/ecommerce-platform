"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";

export function PasswordRecoveryClient({ isResetMode }: { isResetMode: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#3d2e24]">
        {isResetMode ? "ĐẶT LẠI MẬT KHẨU MỚI" : "KHÔI PHỤC MẬT KHẨU"}
      </h1>
      <p className="mt-1 text-xs text-gray-500">
        {isResetMode
          ? "Nhập mật khẩu mới cho tài khoản Nari Home của bạn."
          : "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu từ hệ thống."}
      </p>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        </div>
      )}

      {isResetMode ? (
        <form onSubmit={(e) => void handleUpdatePassword(e)} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Mật khẩu mới
            <div className="relative mt-1">
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Xác nhận mật khẩu mới
            <div className="relative mt-1">
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-sm font-semibold text-white hover:bg-[#1e1b18] disabled:opacity-50"
          >
            {busy ? "Đang cập nhật..." : "CẬP NHẬT MẬT KHẨU"}
          </button>
        </form>
      ) : (
        <form onSubmit={(e) => void handleRequestReset(e)} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email tài khoản
            <div className="relative mt-1">
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                placeholder="ten-cua-ban@email.com"
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm"
              />
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[#3d2e24] py-2.5 text-sm font-semibold text-white hover:bg-[#1e1b18] disabled:opacity-50"
          >
            {busy ? "Đang gửi liên kết..." : "GỬI LIÊN KẾT KHÔI PHỤC"}
          </button>
        </form>
      )}

      <div className="mt-6 border-t border-gray-100 pt-4 flex items-center justify-between text-xs">
        <Link href="/dang-nhap" className="font-semibold text-[#b86b4b] hover:underline">
          ← Quay lại đăng nhập
        </Link>
        <Link href="/dang-ky" className="text-gray-600 hover:underline">
          Đăng ký tài khoản mới
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { AUTH_CHANGE_EVENT, clearAuthSession } from "@/lib/auth";
import { logoutProviderSession, type SessionCapabilities } from "@/lib/session-capabilities";

export function AccountDialog({
  onClose,
  capabilities,
  onLoggedOut,
}: {
  onClose: () => void;
  capabilities: SessionCapabilities;
  onLoggedOut: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, []);

  async function handleQuickLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");

    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setErrorMessage(typeof data.error === "string" ? data.error : "Email hoặc mật khẩu chưa chính xác.");
        return;
      }
      clearAuthSession();
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      setPassword("");
      setStatusMessage("Đăng nhập thành công! Đang cập nhật phiên...");
      setTimeout(() => {
        dialog.current?.close();
      }, 450);
    } catch {
      setErrorMessage("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setErrorMessage("");
    setStatusMessage("");
    try {
      await logoutProviderSession();
      clearAuthSession();
      onLoggedOut();
      setStatusMessage("Đã đăng xuất an toàn.");
    } catch {
      setErrorMessage("Chưa thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialog.current) {
          dialog.current?.close();
        }
      }}
      aria-labelledby="account-dialog-title"
      className="fixed inset-0 m-auto w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-2xl border border-[#e6d5c5] bg-white p-0 text-[#1e1b18] shadow-[0_24px_70px_rgba(30,27,24,0.28)] backdrop:bg-[#1e1b18]/65 backdrop:backdrop-blur-[3px]"
    >
      {/* Luxury Espresso Header */}
      <div className="relative bg-gradient-to-br from-[#3d2e24] via-[#2f231b] to-[#1e1b18] px-6 py-5 text-[#faf5f0]">
        <button
          type="button"
          aria-label="Đóng"
          onClick={() => dialog.current?.close()}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[#f6ece3] transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8b89c]">
          Nari Home · Thành viên
        </p>
        <h2 id="account-dialog-title" className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#faf5f0]">
          {capabilities.authenticated ? "Tài khoản của bạn" : "Đăng nhập Nari Home"}
        </h2>
        <p className="mt-1 text-xs text-[#e6d5c5]/85">
          {capabilities.authenticated
            ? "Phiên đã xác thực. Chọn không gian làm việc hoặc hồ sơ bên dưới."
            : "Theo dõi đơn hàng NariNow 2H và nhận đặc quyền Nari Rewards."}
        </p>
      </div>

      {/* Modal Body */}
      <div className="p-6">
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {capabilities.authenticated ? (
          <div className="space-y-2.5">
            <Link
              href="/khach-hang/tai-khoan"
              onClick={() => dialog.current?.close()}
              className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-[#faf5f0]/60 px-4 py-3 text-sm font-medium text-[#3d2e24] transition hover:border-[#9e7656] hover:bg-[#f6ece3]"
            >
              <span className="flex items-center gap-3">
                <UserRound className="h-4 w-4 text-[#b86b4b]" />
                <span>Cổng khách hàng & Đơn hàng</span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#9e7656] transition group-hover:translate-x-0.5" />
            </Link>

            {(capabilities.catalogAccess || capabilities.staffPortalAccess) && (
              <Link
                href="/quan-tri"
                onClick={() => dialog.current?.close()}
                className="group flex items-center justify-between rounded-xl border border-[#3d2e24]/25 bg-[#f6ece3] px-4 py-3 text-sm font-semibold text-[#3d2e24] transition hover:border-[#3d2e24] hover:bg-[#efe2d4]"
              >
                <span className="flex items-center gap-3">
                  <LayoutDashboard className="h-4 w-4 text-[#3d2e24]" />
                  <span>Cổng quản trị ERP</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#3d2e24] transition group-hover:translate-x-0.5" />
              </Link>
            )}

            {capabilities.catalogAccess && (
              <Link
                href="/quan-tri/san-pham"
                onClick={() => dialog.current?.close()}
                className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition hover:border-[#9e7656] hover:bg-[#faf5f0]"
              >
                <span className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-[#b86b4b]" />
                  <span>Quản lý sản phẩm</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#9e7656] transition group-hover:translate-x-0.5" />
              </Link>
            )}

            {capabilities.staffPortalAccess && (
              <Link
                href="/nhan-vien"
                onClick={() => dialog.current?.close()}
                className="group flex items-center justify-between rounded-xl border border-[#e6d5c5] bg-white px-4 py-3 text-sm font-medium text-[#3d2e24] transition hover:border-[#9e7656] hover:bg-[#faf5f0]"
              >
                <span className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-[#b86b4b]" />
                  <span>Cổng nhân viên</span>
                </span>
                <ChevronRight className="h-4 w-4 text-[#9e7656] transition group-hover:translate-x-0.5" />
              </Link>
            )}

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#efe2d4] pt-4">
              <Link
                href="/dang-nhap"
                onClick={() => dialog.current?.close()}
                className="text-xs font-medium text-[#6e5a4f] hover:text-[#3d2e24] hover:underline"
              >
                Trạng thái phiên
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void logout();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                <span>{busy ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <form onSubmit={(event) => void handleQuickLogin(event)} className="space-y-3.5">
              <div>
                <label htmlFor="modal-login-email" className="mb-1.5 block text-xs font-semibold text-[#3d2e24]">
                  Email tài khoản
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]" />
                  <input
                    id="modal-login-email"
                    type="email"
                    autoComplete="username"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@narihome.io.vn"
                    disabled={busy}
                    className="w-full rounded-xl border border-[#d9c5b2] bg-[#faf5f0]/40 py-2.5 pl-10 pr-3.5 text-sm text-[#1e1b18] placeholder:text-[#9c897d] transition focus:border-[#9e7656] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e7656]/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="modal-login-password" className="text-xs font-semibold text-[#3d2e24]">
                    Mật khẩu
                  </label>
                  <Link
                    href="/khoi-phuc-mat-khau"
                    onClick={() => dialog.current?.close()}
                    className="text-xs font-medium text-[#b86b4b] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7656]" />
                  <input
                    id="modal-login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    maxLength={128}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Nhập mật khẩu..."
                    disabled={busy}
                    className="w-full rounded-xl border border-[#d9c5b2] bg-[#faf5f0]/40 py-2.5 pl-10 pr-10 text-sm text-[#1e1b18] placeholder:text-[#9c897d] transition focus:border-[#9e7656] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9e7656]/20 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7769] hover:text-[#3d2e24]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3d2e24] px-4 py-3 text-sm font-semibold text-[#faf5f0] shadow-sm transition hover:bg-[#2a1f18] disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{busy ? "Đang xác thực..." : "Đăng nhập"}</span>
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between border-t border-[#efe2d4] pt-4 text-xs">
              <span className="text-[#6e5a4f]">
                Chưa có tài khoản?{" "}
                <Link
                  href="/dang-ky"
                  onClick={() => dialog.current?.close()}
                  className="font-semibold text-[#b86b4b] hover:underline"
                >
                  Đăng ký ngay
                </Link>
              </span>
              <Link
                href="/dang-nhap"
                onClick={() => dialog.current?.close()}
                className="font-medium text-[#3d2e24] hover:underline"
              >
                Trang đầy đủ →
              </Link>
            </div>

            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#faf5f0] px-3 py-2 text-[11px] text-[#6e5a4f]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#9e7656]" />
              <span>Bảo mật xác thực Supabase Auth & phiên mã hóa an toàn.</span>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clearAuthSession } from "@/lib/auth";
import { logoutProviderSession, type SessionCapabilities } from "@/lib/session-capabilities";

export function AccountDialog({ onClose, capabilities, onLoggedOut }: { onClose: () => void; capabilities: SessionCapabilities; onLoggedOut: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (dialog.current && !dialog.current.open) dialog.current.showModal(); }, []);
  async function logout() {
    setBusy(true); setMessage("");
    try {
      await logoutProviderSession();
      clearAuthSession();
      onLoggedOut();
      setMessage("Đã đăng xuất.");
    } catch { setMessage("Chưa thể đăng xuất. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose} aria-labelledby="account-dialog-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border p-6 backdrop:bg-black/40">
    <div className="flex items-center justify-between gap-4">
      <h2 id="account-dialog-title" className="text-xl font-semibold">Tài khoản</h2>
      <button type="button" aria-label="Đóng" onClick={() => dialog.current?.close()} className="rounded px-3 py-2">×</button>
    </div>
    <p className="my-4 text-sm text-gray-600">{capabilities.authenticated ? "Máy chủ đã xác thực tài khoản. Mở màn hình được cấp quyền bên dưới." : "Đăng nhập để xem các màn hình được cấp quyền cho tài khoản."}</p>
    {capabilities.catalogAccess && <Link href="/quan-tri/san-pham" onClick={() => dialog.current?.close()} className="mb-3 block rounded border px-4 py-3">Quản lý sản phẩm</Link>}
    {capabilities.staffPortalAccess && <Link href="/nhan-vien" onClick={() => dialog.current?.close()} className="mb-3 block rounded border px-4 py-3">Cổng nhân viên</Link>}
    <Link href="/dang-nhap" onClick={() => dialog.current?.close()} className="block rounded bg-[#326e51] px-4 py-3 text-center font-semibold text-white">{capabilities.authenticated ? "Trạng thái đăng nhập" : "Đăng nhập"}</Link>
    {capabilities.authenticated && <button type="button" disabled={busy} onClick={() => { void logout(); }} className="mt-3 underline disabled:opacity-50">{busy ? "Đang đăng xuất…" : "Đăng xuất"}</button>}
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    <p className="mt-4 text-sm text-gray-500">Đăng ký và khôi phục mật khẩu chưa khả dụng.</p>
  </dialog>;
}

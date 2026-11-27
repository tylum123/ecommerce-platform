import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Info } from "lucide-react";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { AuthShell } from "@/components/sites/nari/auth-shell";
import { SupabaseLoginForm } from "@/components/sites/nari/supabase-login-form";
import { isSupabaseSessionConfigured } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Đăng nhập",
  robots: { index: false, follow: false },
};

function sanitizeRedirectPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\r\n\0]/.test(raw)) {
    return "";
  }
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect?: string; error?: string; reason?: string }>;
}) {
  const configured = isSupabaseSessionConfigured();
  const params = searchParams ? await searchParams : {};
  const redirectTo = sanitizeRedirectPath(params.redirect);

  return (
    <>
      <Header />
      <AuthShell
        breadcrumbLabel="Đăng nhập"
        title={configured ? "Đăng nhập Nari Home" : "Đăng nhập tạm chưa khả dụng"}
        subtitle={
          configured
            ? "Đăng nhập tài khoản thành viên để theo dõi đơn hàng, tích điểm Nari Rewards và truy cập các màn hình được cấp quyền."
            : undefined
        }
      >
        {!configured && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-[#e6d5c5] bg-[#faf5f0] p-4 text-sm text-[#3d2e24]"
          >
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#9e7656]" aria-hidden="true" />
            <p className="leading-relaxed">
              Chức năng đăng nhập, đăng ký và khôi phục mật khẩu đang được hoàn thiện. Các màn hình quản trị, nhân viên và dữ liệu tài khoản hiện chưa mở truy cập.
            </p>
          </div>
        )}

        {params.error === "callback_invalid" && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập hoặc yêu cầu liên kết mới.</span>
          </div>
        )}

        {configured && <SupabaseLoginForm redirectTo={redirectTo} />}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#efe3d7] pt-5 text-sm">
          <Link href="/" className="font-medium text-[#3d2e24] transition-colors hover:text-[#b86b4b] hover:underline">
            Về trang chủ
          </Link>
          {configured && (
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/dang-ky" className="font-semibold text-[#b86b4b] transition-colors hover:text-[#3d2e24] hover:underline">
                Đăng ký tài khoản
              </Link>
              <Link href="/khoi-phuc-mat-khau" className="text-[#6e5a4f] transition-colors hover:text-[#3d2e24] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
          )}
        </div>
      </AuthShell>
      <Footer />
    </>
  );
}

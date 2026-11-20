import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { SupabaseLoginForm } from "@/components/sites/nari/supabase-login-form";
import { isSupabaseSessionConfigured } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";

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
      <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-12">
        <h1 className="mb-4 text-2xl font-semibold">
          {configured ? "Đăng nhập Nari Home" : "Đăng nhập tạm chưa khả dụng"}
        </h1>
        <p role="status" className="mb-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          {configured
            ? "Đăng nhập bằng tài khoản Nari Home để xem hồ sơ thành viên, đơn hàng, lịch hẹn Clinic và truy cập các màn hình được cấp quyền."
            : "Chức năng đăng nhập, đăng ký và khôi phục mật khẩu đang được hoàn thiện. Các màn hình quản trị, nhân viên và dữ liệu tài khoản hiện chưa mở truy cập."}
        </p>
        {params.error === "callback_invalid" && (
          <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Liên kết xác thực không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập hoặc yêu cầu liên kết mới.
          </p>
        )}
        {configured && <SupabaseLoginForm redirectTo={redirectTo} />}
        <div className="my-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/" className="text-[#326e51] underline">
            Về trang chủ
          </Link>
          {configured && (
            <div className="flex items-center gap-4">
              <Link href="/dang-ky" className="font-medium text-[#b86b4b] underline">
                Đăng ký tài khoản
              </Link>
              <Link href="/khoi-phuc-mat-khau" className="text-gray-600 underline">
                Quên mật khẩu?
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

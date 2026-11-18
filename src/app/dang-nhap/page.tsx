import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { SupabaseLoginForm } from "@/components/sites/hasaki/supabase-login-form";
import { isSupabaseSessionConfigured } from "@/lib/server/supabase-session";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const configured = isSupabaseSessionConfigured();
  return <>
    <Header />
    <main className="mx-auto min-h-[60vh] max-w-lg px-4 py-12">
      <h1 className="mb-4 text-2xl font-semibold">{configured ? "Đăng nhập" : "Đăng nhập tạm chưa khả dụng"}</h1>
      <p role="status" className="mb-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{configured ? "Máy chủ kiểm tra quyền quản lý danh mục và cổng nhân viên theo tài khoản đã được cấp quyền. Các tác vụ nghiệp vụ chưa tích hợp vẫn tạm khóa." : "Chức năng đăng nhập, đăng ký và khôi phục mật khẩu đang được hoàn thiện. Các màn hình quản trị, nhân viên và dữ liệu tài khoản hiện chưa mở truy cập."}</p>
      {configured && <SupabaseLoginForm />}
      <p className="my-6 text-sm text-gray-600">Tài khoản thử nghiệm cũ không còn sử dụng được. Bạn vẫn có thể xem và tìm kiếm sản phẩm.</p>
      <Link href="/" className="text-[#326e51] underline">Về trang chủ</Link>
    </main>
    <Footer />
  </>;
}

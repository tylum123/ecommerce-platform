import type { Metadata } from "next";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { AuthShell } from "@/components/sites/nari/auth-shell";
import { PasswordRecoveryClient } from "@/components/sites/nari/password-recovery-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Khôi phục mật khẩu",
  robots: { index: false, follow: false },
};

export default async function KhoiPhucMatKhauPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const isResetMode = params.mode === "reset";

  return (
    <>
      <Header />
      <AuthShell
        breadcrumbLabel={isResetMode ? "Đặt lại mật khẩu" : "Khôi phục mật khẩu"}
        title={isResetMode ? "Đặt lại mật khẩu mới" : "Khôi phục mật khẩu"}
        subtitle={
          isResetMode
            ? "Nhập mật khẩu mới cho tài khoản Nari Home của bạn."
            : "Nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu từ hệ thống."
        }
      >
        <PasswordRecoveryClient isResetMode={isResetMode} />
      </AuthShell>
      <Footer />
    </>
  );
}

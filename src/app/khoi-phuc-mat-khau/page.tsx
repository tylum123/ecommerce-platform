import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { PasswordRecoveryClient } from "@/components/sites/nari/password-recovery-view";

export const dynamic = "force-dynamic";

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
      <main className="min-h-[70vh] bg-[#faf5f0] px-4 py-12">
        <PasswordRecoveryClient isResetMode={isResetMode} />
      </main>
      <Footer />
    </>
  );
}

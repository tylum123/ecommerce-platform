import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, verifySignedSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function KhachHangRootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySignedSessionToken(token) : null;

  if (!session) {
    redirect("/dang-nhap?redirect=/khach-hang/tai-khoan");
  }

  redirect("/khach-hang/tai-khoan");
}

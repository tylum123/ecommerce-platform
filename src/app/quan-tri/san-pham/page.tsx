import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { notFound, redirect } from "next/navigation";
import { authorizeCatalogRequest } from "@/lib/server/catalog-admin-access";
import { AdminProductsView } from "@/components/sites/nari/admin-products-view";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const access = await authorizeCatalogRequest(new NextRequest("http://localhost/quan-tri/san-pham", { headers: await headers() }));
  if (access.response?.status === 401) redirect("/dang-nhap?redirect=/quan-tri/san-pham");
  if (access.response?.status === 403) notFound();
  if (access.response) return <main className="p-8"><h1 className="text-xl font-semibold">Quản lý danh mục chưa khả dụng</h1><p className="mt-3">Dịch vụ đang chờ cấu hình xác thực và dữ liệu. Vui lòng thử lại sau.</p></main>;
  return <AdminProductsView />;
}

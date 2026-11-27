import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllCatalogProducts } from "@/lib/catalog";
import { catalogBackend, readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { getPostgresDatabase } from "@/lib/server/postgres-database";
import { readPostgresBranchesSafely } from "@/lib/server/postgres-branch-service";
import { generateVietQrPaymentDetails } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

const MAX_CART_ITEMS = 50;
const MAX_ITEM_QUANTITY = 99;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, code: "INVALID_BODY", error: "Dữ liệu giỏ hàng không hợp lệ." },
        { status: 400 }
      );
    }

    const rawItems: Array<{ sku?: string; slug?: string; quantity?: number }> = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0 || rawItems.length > MAX_CART_ITEMS) {
      return NextResponse.json(
        { success: false, code: "INVALID_CART_ITEMS", error: "Giỏ hàng cần ít nhất 1 sản phẩm và tối đa 50 dòng." },
        { status: 400 }
      );
    }

    const province = typeof body.province === "string" ? body.province.trim().slice(0, 80) : "";
    const district = typeof body.district === "string" ? body.district.trim().slice(0, 80) : "";
    const deliveryType = body.deliveryType === "Tiêu chuẩn" ? "Tiêu chuẩn" : "NariNow 2H";

    catalogBackend();
    const live = await readStorefrontCatalog();
    const catalogProducts = getAllCatalogProducts(live);
    const byKey = new Map<string, (typeof catalogProducts)[number]>();
    for (const product of catalogProducts) {
      if (product.sku) byKey.set(product.sku.toLowerCase(), product);
      if (product.slug) byKey.set(product.slug.toLowerCase(), product);
    }

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of rawItems) {
      const lookup = typeof item.sku === "string" && item.sku.trim()
        ? item.sku.trim()
        : typeof item.slug === "string" && item.slug.trim()
          ? item.slug.trim()
          : "";
      const qty = Number(item.quantity);
      if (!lookup || !Number.isInteger(qty) || qty < 1 || qty > MAX_ITEM_QUANTITY) {
        return NextResponse.json(
          { success: false, code: "INVALID_CART_ITEM", error: "Sản phẩm hoặc số lượng không hợp lệ." },
          { status: 400 }
        );
      }

      const prod = byKey.get(lookup.toLowerCase());
      if (!prod || typeof prod.price !== "number" || !Number.isFinite(prod.price) || prod.price < 0) {
        return NextResponse.json(
          { success: false, code: "PRODUCT_NOT_FOUND", error: "Không tìm thấy sản phẩm hợp lệ trong danh mục." },
          { status: 404 }
        );
      }

      // Server-authoritative pricing: never trust client-submitted prices.
      const price = Math.trunc(prod.price);
      const lineSubtotal = price * qty;
      subtotal += lineSubtotal;

      resolvedItems.push({
        sku: prod.sku || prod.slug,
        slug: prod.slug,
        name: prod.name,
        price,
        quantity: qty,
        subtotal: lineSubtotal,
        thumbnailUrl: prod.image || null,
      });
    }

    // Free NariNow 2H for orders >= 90.000 VND
    const shippingFee = deliveryType === "NariNow 2H" && subtotal >= 90000 ? 0 : 25000;
    const total = subtotal + shippingFee;

    const branches = await readPostgresBranchesSafely(
      getPostgresDatabase,
      province || district ? { city: province || undefined, district: district || undefined } : undefined,
    );
    const NariNowBranches = branches.filter((b) => Boolean(b.supportsNowfree2h));
    const clinicBranches = branches.filter((b) => Boolean(b.hasClinic));
    const isNariNowAvailable = NariNowBranches.length > 0;

    // Provisional VietQR preview
    const tempOrderCode = `PROV-${Date.now().toString().slice(-6)}`;
    const vietQrPreview = generateVietQrPaymentDetails({
      amount: total,
      orderCode: tempOrderCode,
    });

    return NextResponse.json({
      success: true,
      source: "postgres",
      quote: {
        subtotal,
        shippingFee,
        discount: 0,
        total,
        deliveryType,
        isNariNowAvailable,
        eligibleForFreeShipping: subtotal >= 90000,
        availableBranchesCount: branches.length,
        NariNowBranchesCount: NariNowBranches.length,
        clinicBranchesCount: clinicBranches.length,
        vietQrPreview,
        paymentMethods: [
          {
            id: "cod",
            name: "Thanh toán khi nhận hàng (COD)",
            description: "Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi",
            isAvailable: true,
          },
          {
            id: "vietqr",
            name: "Quét mã VietQR (NAPAS 24/7)",
            description: "Chuyển khoản liên ngân hàng miễn phí qua mã QR tức thì",
            isAvailable: true,
            qrUrl: vietQrPreview.qrUrl,
          },
          {
            id: "vnpay",
            name: "Ví VNPAY / Thẻ ATM / Visa",
            description: "Cổng thanh toán điện tử VNPAY-QR",
            isAvailable: true,
          },
          {
            id: "momo",
            name: "Ví MoMo",
            description: "Thanh toán một chạm qua ứng dụng MoMo",
            isAvailable: true,
          },
        ],
        location: { province, district },
        items: resolvedItems,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const unavailable = code === "CATALOG_POSTGRES_UNAVAILABLE" || code === "CATALOG_BACKEND_REQUIRED";
    return NextResponse.json(
      {
        success: false,
        code: unavailable ? code : "CART_QUOTE_FAILED",
        error: unavailable ? "Hệ thống báo giá tạm chưa sẵn sàng." : "Lỗi tính toán báo giá đơn hàng.",
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}

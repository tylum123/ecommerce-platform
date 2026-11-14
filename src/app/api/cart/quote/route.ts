import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProductBySkuOrSlug, listAllBranches } from "@/lib/sqlite-db";
import { generateVietQrPaymentDetails } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawItems: Array<{ sku?: string; slug?: string; quantity?: number; price?: number }> = body.items || [];
    const province = body.province || "";
    const district = body.district || "";
    const deliveryType = body.deliveryType === "Tiêu chuẩn" ? "Tiêu chuẩn" : "NowFree 2H";

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of rawItems) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const prod = item.sku || item.slug ? getProductBySkuOrSlug(item.sku || item.slug || "") : null;

      const price = typeof item.price === "number" && item.price > 0 ? item.price : (prod ? prod.price : 100000);
      const lineSubtotal = price * qty;
      subtotal += lineSubtotal;

      resolvedItems.push({
        sku: prod ? prod.sku : (item.sku || "10023401"),
        name: prod ? prod.name : "Sản phẩm",
        price,
        quantity: qty,
        subtotal: lineSubtotal,
        thumbnailUrl: prod ? prod.thumbnailUrl : null,
      });
    }

    // Free NowFree 2H for orders >= 90.000 VND
    const shippingFee = deliveryType === "NowFree 2H" && subtotal >= 90000 ? 0 : 25000;
    const total = subtotal + shippingFee;

    // Multi-Branch NowFree 2H & Clinic capability checking
    const branches = listAllBranches(true);
    const nowFreeBranches = branches.filter((b) => b.supportsNowFree2H);
    const clinicBranches = branches.filter((b) => b.supportsClinic);

    const isNowFreeAvailable = nowFreeBranches.length > 0;

    // Provisional VietQR preview
    const tempOrderCode = `PROV-${Date.now().toString().slice(-6)}`;
    const vietQrPreview = generateVietQrPaymentDetails({
      amount: total,
      orderCode: tempOrderCode,
    });

    return NextResponse.json({
      success: true,
      quote: {
        subtotal,
        shippingFee,
        discount: 0,
        total,
        deliveryType,
        isNowFreeAvailable,
        eligibleForFreeShipping: subtotal >= 90000,
        availableBranchesCount: branches.length,
        nowFreeBranchesCount: nowFreeBranches.length,
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
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lỗi tính toán báo giá đơn hàng" },
      { status: 500 }
    );
  }
}

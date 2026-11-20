"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, CheckCircle2, MapPin, Truck, AlertTriangle } from "lucide-react";
import { readCart } from "@/lib/cart";
import { money, findCatalogProduct } from "@/lib/catalog";
import type { StoreBranchInfo } from "@/lib/backend-contracts";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";
import { getNewArrivals } from "@/lib/new-arrivals";
import {
  readLocation,
  formatLocationShort,
  isNariNowDistrict,
  LOCATION_CHANGE_EVENT,
  type LocationSelection,
} from "@/lib/campaigns-location";
import { Footer } from "@/components/sites/nari/footer";
import { NariHomeLogo } from "@/components/sites/nari/nari-home-logo";

const subscribe = (callback: () => void) => {
  window.addEventListener("demo-cart-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-cart-change", callback);
    window.removeEventListener("storage", callback);
  };
};

const snapshot = () => localStorage.getItem("nari-cart") ?? "[]";

export interface CheckoutRowItem {
  slug: string;
  quantity: number;
  product: {
    slug: string;
    brand: string;
    name: string;
    price: number;
    image?: string;
  };
}

interface CheckoutVietQrSummary {
  qrUrl: string;
  bankId?: string;
  accountNo?: string;
  accountName?: string;
  amount?: number;
  orderCode?: string;
}

interface SubmittedOrderSummary {
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  branchName: string;
  deliveryType: string;
  note: string;
  paymentMethod: string;
  totalAmount: number;
  vietQr: CheckoutVietQrSummary | null;
}

function parseVietQr(raw: unknown): CheckoutVietQrSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.qrUrl !== "string" || !record.qrUrl) return null;
  return {
    qrUrl: record.qrUrl,
    bankId: typeof record.bankId === "string" ? record.bankId : undefined,
    accountNo: typeof record.accountNo === "string" ? record.accountNo : undefined,
    accountName: typeof record.accountName === "string" ? record.accountName : undefined,
    amount: typeof record.amount === "number" ? record.amount : undefined,
    orderCode: typeof record.orderCode === "string" ? record.orderCode : undefined,
  };
}

export function CheckoutView({
  liveCatalog,
  branches = [],
}: {
  liveCatalog?: LiveCatalogOverridesState;
  branches?: StoreBranchInfo[];
}) {
  const cart = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = cart === "[]" ? [] : readCart();

  const rows: CheckoutRowItem[] = [];
  const unknownSlugs: string[] = [];

  for (const item of items) {
    if (liveCatalog?.deletedSlugs.includes(item.slug)) continue;
    const catalogItem = findCatalogProduct(item.slug, liveCatalog);
    if (catalogItem) {
      rows.push({
        ...item,
        product: {
          slug: catalogItem.slug,
          brand: catalogItem.brand,
          name: catalogItem.name,
          price: catalogItem.price,
          image: catalogItem.image,
        },
      });
      continue;
    }

    const observed = getNewArrivals(liveCatalog).find(p => p.slug === item.slug);
    if (observed) {
      rows.push({
        ...item,
        product: {
          slug: observed.slug,
          brand: observed.brand,
          name: observed.name,
          price: observed.numericPrice,
          image: observed.detail?.images[0] || observed.image,
        },
      });
      continue;
    }

    unknownSlugs.push(item.slug);
  }

  const [branchId, setBranchId] = useState<string>(() => branches[0]?.id ?? "");
  const [deliveryType, setDeliveryType] = useState<"NariNow 2H" | "Tiêu chuẩn">("NariNow 2H");

  const subtotal = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);
  const estimatedShippingFee =
    rows.length > 0 ? (deliveryType === "NariNow 2H" && subtotal >= 90000 ? 0 : 25000) : 0;
  const estimatedTotal = subtotal + estimatedShippingFee;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState(() => {
    const loc = readLocation();
    if (loc && loc.province) {
      const parts = [loc.ward, loc.district, loc.province].filter(Boolean);
      return parts.join(", ");
    }
    return "";
  });
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("cod");
  const [review, setReview] = useState(false);
  const [savedLoc, setSavedLoc] = useState<LocationSelection | null>(() => readLocation());
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");
  const [submittedSummary, setSubmittedSummary] = useState<SubmittedOrderSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    idempotencyKeyRef.current = null;
  }, [cart, name, phone, address, note, payment, branchId, deliveryType]);

  useEffect(() => {
    const handleLocChange = () => {
      const loc = readLocation();
      setSavedLoc(loc);
      if (loc && loc.province) {
        const parts = [loc.ward, loc.district, loc.province].filter(Boolean);
        if (parts.length > 0) {
          setAddress(prev => (prev ? prev : parts.join(", ")));
        }
      }
    };

    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
    window.addEventListener("storage", handleLocChange);
    return () => {
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocChange);
      window.removeEventListener("storage", handleLocChange);
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !rows.length) return;
    setSubmitting(true);
    setSubmitError("");
    setReview(false);

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          branchId: branchId || undefined,
          recipientName: name,
          recipientPhone: phone,
          shippingAddress: address,
          note,
          deliveryType,
          paymentMethod: payment,
          items: rows.map(row => ({ slug: row.slug, quantity: row.quantity })),
        }),
      });

      const payload: unknown = await response.json().catch(() => null);
      const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;

      if (!response.ok) {
        if (response.status >= 400 && response.status < 500) {
          idempotencyKeyRef.current = null;
        }
        const serverError = obj && typeof obj.error === "string" && obj.error ? obj.error : null;
        throw new Error(
          serverError ||
            "Chưa thể tạo đơn hàng. Dịch vụ đặt hàng hiện chưa khả dụng; giỏ hàng của bạn được giữ nguyên.",
        );
      }

      const returnedCode =
        obj && typeof obj.orderCode === "string" && obj.orderCode
          ? obj.orderCode
          : obj && typeof obj.code === "string" && obj.code
            ? obj.code
            : "";
      if (!returnedCode) {
        throw new Error("Máy chủ chưa trả mã xác nhận đơn hàng. Vui lòng thử lại sau.");
      }

      const orderRecord =
        obj?.order && typeof obj.order === "object" ? (obj.order as Record<string, unknown>) : null;
      const serverTotal =
        orderRecord && typeof orderRecord.totalAmount === "number" ? orderRecord.totalAmount : estimatedTotal;
      const vietQr = parseVietQr(obj?.vietQr);

      const selectedBranch = branches.find(b => b.id === branchId);

      setSubmittedSummary({
        orderCode: returnedCode,
        recipientName: name,
        recipientPhone: phone,
        shippingAddress: address,
        branchName: selectedBranch ? `${selectedBranch.name} (${selectedBranch.district}, ${selectedBranch.city})` : "",
        deliveryType,
        note,
        paymentMethod: payment,
        totalAmount: serverTotal,
        vietQr,
      });

      localStorage.removeItem("nari-cart");
      window.dispatchEvent(new Event("demo-cart-change"));
      idempotencyKeyRef.current = null;
      setCreatedOrderCode(returnedCode);
      setReview(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Không thể kết nối dịch vụ đặt hàng. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="cart-top">
        <div className="wrap">
          <Link href="/" aria-label="Nari Home">
            <NariHomeLogo theme="light" compact={true} />
          </Link>
          <div>
            <ShoppingCart /> THÔNG TIN ĐẶT HÀNG
          </div>
          <Link href="/gio-hang">Quay lại giỏ hàng</Link>
        </div>
      </div>

      <main className="wrap cart-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › <Link href="/gio-hang">Giỏ hàng</Link> › Thanh toán
        </div>
        <h1>
          Thông tin đặt hàng <small>({rows.length} sản phẩm)</small>
        </h1>

        {unknownSlugs.length > 0 && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              marginBottom: 14,
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 6,
              color: "#92400e",
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={16} />
            <span>
              {unknownSlugs.length} sản phẩm không còn khớp với danh mục trực tiếp nên đã được loại khỏi đơn thanh toán.
            </span>
          </div>
        )}

        {!rows.length && !review ? (
          <section className="cart-empty">
            <ShoppingCart size={52} />
            <p>Giỏ hàng của bạn đang trống</p>
            <Link href="/">TIẾP TỤC MUA SẮM</Link>
          </section>
        ) : !review ? (
          <div className="cart-layout">
            <div>
              <form id="checkout-form" className="cart-box checkout-form" onSubmit={submit}>
                <h2>Thông tin nhận hàng</h2>
                <p className="checkout-note">
                  Giá và tồn kho được xác thực trực tiếp từ máy chủ khi xác nhận đơn hàng.
                </p>

                {savedLoc && (
                  <div
                    style={{
                      padding: "8px 12px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#166534",
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={14} className="text-[#3d2e24]" />
                    <span>
                      Khu vực đã chọn: <strong>{formatLocationShort(savedLoc)}</strong>
                    </span>
                    {isNariNowDistrict(savedLoc.province, savedLoc.district) && (
                      <span
                        style={{
                          background: "#3d2e24",
                          color: "#fff",
                          padding: "1px 6px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: "bold",
                          marginLeft: "auto",
                        }}
                      >
                        NariNow 2H
                      </span>
                    )}
                  </div>
                )}

                <label>
                  Họ và tên{" "}
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Nhập họ và tên"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Số điện thoại{" "}
                  <input
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="Nhập số điện thoại (10 chữ số)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    pattern="0[0-9]{9}"
                    title="Nhập 10 chữ số bắt đầu bằng 0"
                    required
                  />
                </label>
                <label>
                  Địa chỉ nhận hàng{" "}
                  <input
                    name="address"
                    autoComplete="street-address"
                    placeholder="Nhập số nhà, tên đường, phường/xã..."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    required
                  />
                </label>
                <label>
                  Ghi chú{" "}
                  <textarea
                    name="note"
                    placeholder="Ghi chú cho đơn hàng (ví dụ: giao giờ hành chính, gọi trước khi đến...)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                </label>

                {branches.length > 0 && (
                  <label>
                    Chi nhánh xử lý & giữ tồn kho{" "}
                    <select
                      name="branchId"
                      value={branchId}
                      onChange={e => setBranchId(e.target.value)}
                    >
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} — {branch.district}, {branch.city}
                          {branch.supportsNowfree2h ? " (Hỗ trợ NariNow 2H)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <fieldset className="checkout-options">
                  <legend>Phương thức vận chuyển</legend>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="NariNow 2H"
                      checked={deliveryType === "NariNow 2H"}
                      onChange={() => setDeliveryType("NariNow 2H")}
                    />
                    <Truck size={16} className="text-[#3d2e24]" />
                    <strong>Giao hàng NariNow 2H</strong>
                    <span style={{ color: "#b86b4b", marginLeft: "auto", fontWeight: 600 }}>
                      {subtotal >= 90000 ? "Miễn phí" : money(25000)}
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 6 }}>
                    <input
                      type="radio"
                      name="deliveryType"
                      value="Tiêu chuẩn"
                      checked={deliveryType === "Tiêu chuẩn"}
                      onChange={() => setDeliveryType("Tiêu chuẩn")}
                    />
                    <span>Giao hàng tiêu chuẩn (2 - 4 ngày)</span>
                    <span style={{ color: "#b86b4b", marginLeft: "auto", fontWeight: 600 }}>
                      {money(25000)}
                    </span>
                  </label>
                  <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                    Miễn phí vận chuyển NariNow 2H cho đơn từ {money(90000)}.
                  </p>
                </fieldset>

                <fieldset className="checkout-options">
                  <legend>Phương thức thanh toán</legend>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={payment === "cod"}
                      onChange={e => setPayment(e.target.value)}
                    />{" "}
                    Thanh toán khi nhận hàng (COD)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="vietqr"
                      checked={payment === "vietqr"}
                      onChange={e => setPayment(e.target.value)}
                    />{" "}
                    Chuyển khoản nhanh VietQR (NAPAS 247)
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment"
                      value="online"
                      checked={payment === "online"}
                      onChange={e => setPayment(e.target.value)}
                    />{" "}
                    Thanh toán trực tuyến (VNPAY-QR / Thẻ ATM / Ví MoMo)
                  </label>
                  <p>Đơn hàng được xác thực số tiền và mã giao dịch trực tiếp từ máy chủ Nari Home.</p>
                </fieldset>
              </form>

              <section className="cart-box checkout-items">
                <h2>Sản phẩm ({rows.length})</h2>
                {rows.map(({ product, quantity }) => (
                  <div key={product.slug} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={44}
                        height={44}
                        unoptimized
                        style={{ objectFit: "contain", borderRadius: 4 }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <Link href={`/san-pham/${product.slug}`} style={{ fontWeight: 500, fontSize: 13, color: "#1f2937" }}>
                        {product.name}
                      </Link>
                      <small style={{ display: "block", color: "#6b7280" }}>{product.brand}</small>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>
                      {quantity} × {money(product.price)}
                    </span>
                  </div>
                ))}
                <Link href="/gio-hang" style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "#b86b4b", fontWeight: 500 }}>
                  ← Sửa giỏ hàng
                </Link>
              </section>
            </div>

            <aside className="cart-box cart-summary">
              <h2>Thông tin đơn hàng</h2>
              <div>
                <span>Tạm tính</span>
                <b>{money(subtotal)}</b>
              </div>
              <div>
                <span>Phí vận chuyển</span>
                <span style={{ color: "#b86b4b", fontWeight: 600 }}>
                  {estimatedShippingFee === 0 ? "Miễn phí" : money(estimatedShippingFee)}
                </span>
              </div>
              <hr />
              <div>
                <strong>Tổng thanh toán</strong>
                <strong style={{ color: "#b86b4b", fontSize: 18 }}>{money(estimatedTotal)}</strong>
              </div>
              <p>Giá đã bao gồm thuế VAT và dịch vụ NariNow 2H.</p>
              {submitError && <p role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>{submitError}</p>}
              <button type="submit" form="checkout-form" disabled={submitting || review} style={{ background: "#3d2e24", color: "#fff", fontWeight: "bold" }}>
                {submitting ? "ĐANG GỬI..." : "ĐẶT HÀNG NGAY"}
              </button>
            </aside>
          </div>
        ) : null}

        {review && submittedSummary && (
          <section className="cart-box checkout-review" role="status" style={{ borderLeft: "4px solid #3d2e24" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <CheckCircle2 className="text-[#3d2e24]" size={24} />
              <h2 style={{ margin: 0, color: "#3d2e24" }}>Đã ghi nhận đơn hàng thành công!</h2>
            </div>
            {createdOrderCode && (
              <p className="checkout-order-code" style={{ fontSize: 15, fontWeight: "bold", color: "#1f2937", margin: "6px 0" }}>
                Mã đơn hàng: <span style={{ color: "#b86b4b", letterSpacing: 0.5 }}>{createdOrderCode}</span>
              </p>
            )}
            <p>
              Người nhận: <strong>{submittedSummary.recipientName}</strong> · SĐT: <strong>{submittedSummary.recipientPhone}</strong>
            </p>
            <p>
              Địa chỉ nhận hàng: <strong>{submittedSummary.shippingAddress}</strong>
            </p>
            {submittedSummary.branchName && (
              <p>
                Chi nhánh xử lý: <strong>{submittedSummary.branchName}</strong>
              </p>
            )}
            <p>
              Vận chuyển: <strong>{submittedSummary.deliveryType}</strong>
            </p>
            {submittedSummary.note && <p>Ghi chú: {submittedSummary.note}</p>}
            <p>
              Hình thức thanh toán:{" "}
              <strong>
                {submittedSummary.paymentMethod === "cod"
                  ? "Thanh toán khi nhận hàng (COD)"
                  : submittedSummary.paymentMethod === "vietqr"
                    ? "Chuyển khoản nhanh VietQR (NAPAS 247)"
                    : "Thanh toán trực tuyến"}
              </strong>
            </p>
            <p>
              Tổng thanh toán: <strong style={{ color: "#b86b4b" }}>{money(submittedSummary.totalAmount)}</strong>
            </p>

            {submittedSummary.vietQr && (
              <div
                style={{
                  marginTop: 14,
                  padding: 14,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                }}
              >
                <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 13 }}>
                  Quét mã VietQR để thanh toán đơn hàng {submittedSummary.orderCode}
                </p>
                <Image
                  src={submittedSummary.vietQr.qrUrl}
                  alt={`Mã VietQR thanh toán đơn ${submittedSummary.orderCode}`}
                  width={220}
                  height={220}
                  unoptimized
                  style={{ borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff" }}
                />
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#4b5563" }}>
                  Ngân hàng: <strong>{submittedSummary.vietQr.bankId}</strong> · STK:{" "}
                  <strong>{submittedSummary.vietQr.accountNo}</strong> · Chủ TK:{" "}
                  <strong>{submittedSummary.vietQr.accountName}</strong>
                </p>
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
              <Link
                href="/tra-cuu-don-hang"
                className="checkout-portal-link"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "#3d2e24",
                  color: "#ffffff",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Tra cứu trạng thái đơn hàng →
              </Link>
              <Link
                href="/"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  background: "#f3f4f6",
                  color: "#1f2937",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

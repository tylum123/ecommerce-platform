"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, CheckCircle2, MapPin, Truck } from "lucide-react";
import { readCart } from "@/lib/cart";
import { money, findCatalogProduct } from "@/lib/catalog";
import { newArrivals } from "@/lib/new-arrivals";
import {
  readLocation,
  formatLocationShort,
  isNariNowDistrict,
  LOCATION_CHANGE_EVENT,
  type LocationSelection,
} from "@/lib/campaigns-location";
import { Footer } from "@/components/sites/hasaki/footer";
import { NariHomeLogo } from "@/components/sites/hasaki/nari-home-logo";

const subscribe = (callback: () => void) => {
  window.addEventListener("demo-cart-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("demo-cart-change", callback);
    window.removeEventListener("storage", callback);
  };
};

const snapshot = () => localStorage.getItem("hasaki-demo-cart") ?? "[]";

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

export function CheckoutView() {
  const cart = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const items = cart === "[]" ? [] : readCart();

  // Resolve cart products from catalog (including deals, bestsellers, brands, categories) or new arrivals
  const rows: CheckoutRowItem[] = items.flatMap(item => {
    const catalogItem = findCatalogProduct(item.slug);
    if (catalogItem) {
      return [
        {
          ...item,
          product: {
            slug: catalogItem.slug,
            brand: catalogItem.brand,
            name: catalogItem.name,
            price: catalogItem.price,
            image: catalogItem.image,
          },
        },
      ];
    }

    const observed = newArrivals.find(p => p.slug === item.slug);
    if (observed) {
      return [
        {
          ...item,
          product: {
            slug: observed.slug,
            brand: observed.brand,
            name: observed.name,
            price: observed.numericPrice,
            image: observed.detail?.images[0] || observed.image,
          },
        },
      ];
    }

    const cleanName = item.slug.replace(/\.html$/, "").replace(/-/g, " ");
    return [
      {
        ...item,
        product: {
          slug: item.slug,
          brand: "Nari Home",
          name: cleanName,
          price: 150000,
          image: undefined,
        },
      },
    ];
  });

  const total = rows.reduce((sum, row) => sum + row.product.price * row.quantity, 0);

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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Keep delivery area in sync with location updates
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
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: name, recipientPhone: phone, shippingAddress: address,
          note, paymentMethod: payment,
          items: rows.map(row => ({ slug: row.slug, quantity: row.quantity })),
        }),
      });
      if (!response.ok) throw new Error("Chưa thể tạo đơn hàng. Dịch vụ đặt hàng hiện chưa khả dụng; giỏ hàng của bạn được giữ nguyên.");
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("code" in result) || typeof result.code !== "string" || !result.code) {
        throw new Error("Máy chủ chưa trả mã xác nhận đơn hàng. Vui lòng thử lại sau.");
      }
      setCreatedOrderCode(result.code);
      setReview(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Không thể kết nối dịch vụ đặt hàng. Vui lòng thử lại sau.");
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
          Thông tin đặt hàng <small>({rows.length} sản phẩm mẫu)</small>
        </h1>

        {!rows.length ? (
          <section className="cart-empty">
            <ShoppingCart size={52} />
            <p>Giỏ hàng của bạn đang trống</p>
            <Link href="/">TIẾP TỤC MUA SẮM</Link>
          </section>
        ) : (
          <div className="cart-layout">
            <div>
              <form id="checkout-demo" className="cart-box checkout-form" onSubmit={submit}>
                <h2>Thông tin nhận hàng</h2>
                <p className="checkout-note">
                  Giao diện thử nghiệm Nari Home. Thông tin được lưu vào Cổng khách hàng để theo dõi đơn
                  hàng demo.
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

                <fieldset className="checkout-options">
                  <legend>Phương thức vận chuyển</legend>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <Truck size={16} className="text-[#3d2e24]" />
                    <strong>Giao hàng NariNow 2H</strong>
                    <span style={{ color: "#b86b4b", marginLeft: "auto", fontWeight: 600 }}>
                      Miễn phí
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#6b7280" }}>
                    Áp dụng cho đơn hàng giao trong khu vực hỗ trợ NariNow của Nari Home.
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
                      value="online"
                      checked={payment === "online"}
                      onChange={e => setPayment(e.target.value)}
                    />{" "}
                    Thanh toán trực tuyến (VNPAY-QR / Thẻ ATM / Ví MoMo)
                  </label>
                  <p>Hệ thống mô phỏng thanh toán an toàn chuẩn Nari Home.</p>
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
                <b>{money(total)}</b>
              </div>
              <div>
                <span>Phí vận chuyển</span>
                <span style={{ color: "#b86b4b", fontWeight: 600 }}>Miễn phí</span>
              </div>
              <hr />
              <div>
                <strong>Tổng thanh toán</strong>
                <strong style={{ color: "#b86b4b", fontSize: 18 }}>{money(total)}</strong>
              </div>
              <p>Giá đã bao gồm thuế VAT và dịch vụ NariNow 2H.</p>
              {submitError && <p role="alert">{submitError}</p>}
              <button type="submit" form="checkout-demo" disabled={submitting || review} style={{ background: "#3d2e24", color: "#fff", fontWeight: "bold" }}>
                {submitting ? "ĐANG GỬI..." : "ĐẶT HÀNG NGAY"}
              </button>
            </aside>
          </div>
        )}

        {review && rows.length > 0 && (
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
              Người nhận: <strong>{name}</strong> · SĐT: <strong>{phone}</strong>
            </p>
            <p>
              Địa chỉ nhận hàng: <strong>{address}</strong>
            </p>
            {note && <p>Ghi chú: {note}</p>}
            <p>
              Hình thức thanh toán: <strong>{payment === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Thanh toán trực tuyến"}</strong>
            </p>
            <p style={{ marginTop: 12 }}>
              <Link
                href="/khach-hang/don-hang"
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
                Quản lý đơn hàng trong Cổng khách hàng →
              </Link>
            </p>
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setReview(false)}
                style={{
                  padding: "6px 14px",
                  background: "#f3f4f6",
                  border: "1px solid #d1d5db",
                  borderRadius: 4,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Đóng bản xem lại
              </button>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

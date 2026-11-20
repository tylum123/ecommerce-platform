"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { Search, PackageCheck, PhoneCall, AlertCircle } from "lucide-react";

interface LookupOrderItem {
  id: string;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface LookupOrderSummary {
  id: string;
  orderCode: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  notes: string;
  createdAt: string;
  items: LookupOrderItem[];
}

const ORDER_STATUS_LABELS: Readonly<Record<string, string>> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy",
  returned: "Đã trả hàng",
};

const PAYMENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  unpaid: "Chưa thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;
}

const subscribeNoop = () => () => {};
const readUrlOrderCode = () =>
  typeof window === "undefined"
    ? ""
    : new URLSearchParams(window.location.search).get("code")?.trim() || "";

export default function OrderLookupPage() {
  const urlOrderCode = useSyncExternalStore(subscribeNoop, readUrlOrderCode, () => "");
  const [editedOrderCode, setEditedOrderCode] = useState<string | null>(null);
  const orderCode = editedOrderCode ?? urlOrderCode;
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [orderResult, setOrderResult] = useState<LookupOrderSummary | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = orderCode.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedCode || !trimmedPhone || loading) return;

    setLoading(true);
    setErrorMessage("");
    setOrderResult(null);

    try {
      const params = new URLSearchParams({ code: trimmedCode, phone: trimmedPhone });
      const response = await fetch(`/api/orders?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const payload: unknown = await response.json().catch(() => null);
      const record = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;

      if (!response.ok) {
        if (response.status === 401 || response.status === 503) {
          const serviceMsg = record && typeof record.error === "string" && record.error ? record.error : "";
          setErrorMessage(
            serviceMsg ||
              "Dịch vụ tra cứu đơn hàng trực tuyến hiện chưa sẵn sàng. Vui lòng thử lại sau hoặc liên hệ Hotline 1800 6324.",
          );
          return;
        }
        const serverError = record && typeof record.error === "string" && record.error ? record.error : "";
        setErrorMessage(
          serverError || "Không tìm thấy đơn hàng khớp với mã đơn hàng và số điện thoại đã nhập.",
        );
        return;
      }

      if (!record?.order || typeof record.order !== "object") {
        setErrorMessage("Phản hồi tra cứu từ máy chủ không hợp lệ.");
        return;
      }

      setOrderResult(record.order as LookupOrderSummary);
    } catch {
      setErrorMessage("Không thể kết nối đến hệ thống tra cứu đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingBottom: "40px", minHeight: "65vh" }}>
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Tra cứu đơn hàng
        </div>

        <section
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "6px",
            border: "1px solid #eaeaea",
            padding: "28px 24px",
            maxWidth: "680px",
            margin: "12px auto 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <PackageCheck size={24} color="#3d2e24" />
            <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#111" }}>
              Kiểm tra tình trạng đơn hàng
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "#666", margin: "0 0 20px", lineHeight: 1.5 }}>
            Nhập mã đơn hàng và số điện thoại đặt hàng để tra cứu tiến độ xử lý & giao hàng NariNow 2H.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "14px" }}>
            <div>
              <label
                htmlFor="order-code"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}
              >
                Mã đơn hàng *
              </label>
              <input
                id="order-code"
                type="text"
                required
                placeholder="Ví dụ: NARI-20261118-001"
                value={orderCode}
                onChange={e => {
                  setEditedOrderCode(e.target.value);
                  setErrorMessage("");
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              />
            </div>

            <div>
              <label
                htmlFor="order-phone"
                style={{ display: "block", fontSize: "12px", fontWeight: 700, marginBottom: "6px", color: "#333" }}
              >
                Số điện thoại đặt hàng *
              </label>
              <input
                id="order-phone"
                type="tel"
                inputMode="numeric"
                pattern="0[0-9]{9}"
                title="Nhập 10 chữ số bắt đầu bằng 0"
                required
                placeholder="Nhập số điện thoại (10 chữ số)"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setErrorMessage("");
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: "#3d2e24",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "11px 18px",
                fontSize: "13px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.75 : 1,
              }}
            >
              <Search size={16} />
              {loading ? "ĐANG TRA CỨU..." : "TRA CỨU ĐƠN HÀNG"}
            </button>
          </form>

          {errorMessage && (
            <div
              role="alert"
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#991b1b",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {orderResult && (
            <div
              role="status"
              style={{
                marginTop: "20px",
                padding: "16px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#1f2937",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                <strong>
                  Đơn hàng <span style={{ color: "#b86b4b" }}>{orderResult.orderCode}</span>
                </strong>
                <span
                  style={{
                    backgroundColor: "#3d2e24",
                    color: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {ORDER_STATUS_LABELS[orderResult.status] ?? orderResult.status}
                </span>
              </div>

              <div style={{ display: "grid", gap: "4px", fontSize: "12.5px", color: "#374151" }}>
                <div>
                  Người nhận: <strong>{orderResult.recipientName}</strong> · SĐT: <strong>{orderResult.recipientPhone}</strong>
                </div>
                <div>
                  Địa chỉ giao hàng: <strong>{orderResult.shippingAddress}</strong>
                </div>
                <div>
                  Giao nhận: <strong>{orderResult.deliveryType}</strong> · Thanh toán:{" "}
                  <strong>{orderResult.paymentMethod.toUpperCase()}</strong> (
                  {PAYMENT_STATUS_LABELS[orderResult.paymentStatus] ?? orderResult.paymentStatus})
                </div>
                {orderResult.notes && <div>Ghi chú: {orderResult.notes}</div>}
              </div>

              <div style={{ marginTop: "12px", borderTop: "1px solid #e5e7eb", paddingTop: "10px" }}>
                <strong style={{ display: "block", marginBottom: "6px", fontSize: "12.5px" }}>
                  Sản phẩm ({orderResult.items.length})
                </strong>
                <div style={{ display: "grid", gap: "6px" }}>
                  {orderResult.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "10px",
                        fontSize: "12.5px",
                        borderBottom: "1px dashed #e5e7eb",
                        paddingBottom: "4px",
                      }}
                    >
                      <span>
                        {item.productName} <small style={{ color: "#6b7280" }}>({item.sku})</small> × {item.quantity}
                      </span>
                      <strong>{formatVnd(item.lineTotal)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "10px", display: "grid", gap: "3px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tạm tính</span>
                  <span>{formatVnd(orderResult.subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Phí vận chuyển</span>
                  <span>{orderResult.shippingFee === 0 ? "Miễn phí" : formatVnd(orderResult.shippingFee)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "14px", color: "#b86b4b", marginTop: "4px" }}>
                  <span>Tổng cộng</span>
                  <span>{formatVnd(orderResult.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "22px",
              paddingTop: "16px",
              borderTop: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <PhoneCall size={14} color="#3d2e24" />
              Hỗ trợ khách hàng (08:00 - 22:00): <strong style={{ color: "#3d2e24" }}>1800 6324</strong>
            </span>
            <Link href="/ho-tro" style={{ color: "#3d2e24", textDecoration: "underline" }}>
              Xem trung tâm hỗ trợ →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

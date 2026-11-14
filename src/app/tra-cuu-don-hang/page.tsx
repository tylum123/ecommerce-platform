"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { Search, PackageCheck, PhoneCall } from "lucide-react";

export default function OrderLookupPage() {
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderCode.trim() || !phone.trim()) return;
    setSubmitted(true);
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
                placeholder="Ví dụ: HSK-20261113-889"
                value={orderCode}
                onChange={e => {
                  setOrderCode(e.target.value);
                  setSubmitted(false);
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
                required
                placeholder="Nhập số điện thoại (10 chữ số)"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setSubmitted(false);
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
                cursor: "pointer",
              }}
            >
              <Search size={16} />
              TRA CỨU ĐƠN HÀNG
            </button>
          </form>

          {submitted && (
            <div
              role="status"
              style={{
                marginTop: "20px",
                padding: "14px 16px",
                backgroundColor: "#f7f8f9",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#333",
              }}
            >
              <strong>Kết quả tra cứu cho mã “{orderCode.trim()}”:</strong>
              <p style={{ margin: "6px 0 0", color: "#555" }}>
                Tính năng tra cứu đơn hàng thời gian thực đang ở chế độ mô phỏng giao diện (chưa kết nối cơ sở dữ liệu vận đơn thật). Vui lòng liên hệ Hotline miễn phí{" "}
                <a href="tel:18006324" style={{ color: "#3d2e24", fontWeight: 700 }}>
                  1800 6324
                </a>{" "}
                để được kiểm tra đơn hàng nhanh nhất.
              </p>
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

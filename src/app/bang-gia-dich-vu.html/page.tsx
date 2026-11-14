"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import {
  clinicServices,
  CLINIC_SERVICE_CATEGORIES,
  categorizeClinicService,
} from "@/lib/clinic-services";

export default function BangGiaDichVuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả dịch vụ");
  const [keyword, setKeyword] = useState("");

  const filteredServices = clinicServices.filter(item => {
    if (selectedCategory !== "Tất cả dịch vụ") {
      if (categorizeClinicService(item.name) !== selectedCategory) return false;
    }
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      const sku = new URLSearchParams(item.booking.split("?")[1] || "").get("sku") || "";
      const matchName = item.name.toLowerCase().includes(q);
      const matchSku = sku.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchDesc) return false;
    }
    return true;
  });

  return (
    <>
      <Header />
      <nav className="booking-clinic-nav" aria-label="Hasaki Clinic">
        <div className="wrap">
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">HASAKI CLINIC &amp; SPA</Link>
          <Link href="/ho-tro/gioi-thieu">GIỚI THIỆU</Link>
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">DỊCH VỤ</Link>
          <Link href="/bang-gia-dich-vu.html" style={{ fontWeight: "bold", color: "#f47722" }}>
            BẢNG GIÁ
          </Link>
          <Link href="/cam-nang.html">CẨM NANG</Link>
          <Link href="/ho-tro/lien-he">LIÊN HỆ</Link>
          <Link href="/booking">ĐẶT HẸN</Link>
        </div>
      </nav>

      <main className="wrap clinic-page" style={{ paddingTop: "14px" }}>
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> ›{" "}
          <Link href="/danh-muc/hasaki-clinic-spa-c331.html">Hasaki Clinic &amp; Spa</Link> › Bảng giá dịch vụ
        </div>

        {/* Page Banner / Title Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #1b4b35 0%, #2f7a55 100%)",
            color: "white",
            padding: "30px 24px",
            borderRadius: "8px",
            marginBottom: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ maxWidth: "880px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                background: "rgba(255,255,255,0.2)",
                padding: "4px 10px",
                borderRadius: "20px",
                display: "inline-block",
                marginBottom: "10px",
              }}
            >
              Hệ thống phòng khám da liễu chuẩn y khoa
            </span>
            <h1 style={{ fontSize: "26px", fontWeight: "bold", margin: "0 0 10px", lineHeight: 1.3 }}>
              BẢNG GIÁ DỊCH VỤ HASAKI CLINIC &amp; SPA
            </h1>
            <p style={{ fontSize: "14px", lineHeight: 1.6, opacity: 0.95, margin: 0 }}>
              Cam kết giá niêm yết minh bạch toàn quốc · 100% Bác sĩ Da Liễu thăm khám &amp; soi da miễn phí · Không phát sinh chi phí · Dụng cụ vô trùng riêng biệt cho từng khách hàng.
            </p>
            <div style={{ marginTop: "12px", fontSize: "12px", opacity: 0.8 }}>
              📅 Bảng giá ghi nhận ngày 13/11/2026 · Áp dụng tại toàn bộ hệ thống chi nhánh Hasaki Clinic &amp; Spa toàn quốc.
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div
          style={{
            background: "white",
            padding: "18px 20px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #eee",
          }}
        >
          {/* Category Tabs */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
              borderBottom: "1px solid #eee",
              paddingBottom: "14px",
            }}
          >
            {CLINIC_SERVICE_CATEGORIES.map(cat => {
              const count =
                cat === "Tất cả dịch vụ"
                  ? clinicServices.length
                  : clinicServices.filter(s => categorizeClinicService(s.name) === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: isActive ? "1px solid #326e51" : "1px solid #ddd",
                    background: isActive ? "#326e51" : "white",
                    color: isActive ? "white" : "#444",
                    fontSize: "13px",
                    fontWeight: isActive ? "bold" : "normal",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: isActive ? "rgba(255,255,255,0.25)" : "#f0f0f0",
                      padding: "2px 6px",
                      borderRadius: "10px",
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ theo tên, mã SKU hoặc công nghệ..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              />
            </div>
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                style={{
                  border: "1px solid #ddd",
                  background: "#f9f9f9",
                  padding: "10px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Xóa tìm kiếm
              </button>
            )}
            <div style={{ fontSize: "13px", color: "#666", whiteSpace: "nowrap" }}>
              Hiển thị: <strong>{filteredServices.length}</strong> / {clinicServices.length} dịch vụ
            </div>
          </div>
        </div>

        {/* 42-Service Price Table */}
        <div
          style={{
            background: "white",
            borderRadius: "8px",
            border: "1px solid #eee",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            marginBottom: "30px",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ background: "#f2f7f4", borderBottom: "2px solid #326e51", color: "#245b40" }}>
                  <th style={{ padding: "12px 14px", width: "90px" }}>Mã DV</th>
                  <th style={{ padding: "12px 14px", minWidth: "260px" }}>Tên dịch vụ phòng khám</th>
                  <th style={{ padding: "12px 14px", width: "160px" }}>Chuyên khoa</th>
                  <th style={{ padding: "12px 14px", width: "150px" }}>Thời lượng</th>
                  <th style={{ padding: "12px 14px", width: "130px" }}>Giá niêm yết</th>
                  <th style={{ padding: "12px 14px", width: "180px", textAlign: "center" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length > 0 ? (
                  filteredServices.map((item, idx) => {
                    const sku =
                      new URLSearchParams(item.booking.split("?")[1] || "").get("sku") ||
                      `HSK-${idx + 1}`;
                    const category = categorizeClinicService(item.name);
                    return (
                      <tr
                        key={item.url}
                        style={{
                          borderBottom: "1px solid #eee",
                          background: idx % 2 === 0 ? "white" : "#fafcfb",
                        }}
                      >
                        <td style={{ padding: "12px 14px", color: "#666", fontFamily: "monospace", fontSize: "12px" }}>
                          {sku}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {item.image && (
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={48}
                                height={48}
                                style={{
                                  borderRadius: "4px",
                                  objectFit: "cover",
                                  flexShrink: 0,
                                  border: "1px solid #eee",
                                }}
                                unoptimized
                              />
                            )}
                            <div>
                              <Link
                                href={`/dich-vu/${item.slug}`}
                                style={{
                                  fontWeight: "bold",
                                  color: "#222",
                                  textDecoration: "none",
                                  lineHeight: 1.4,
                                }}
                              >
                                {item.name}
                              </Link>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#777",
                                  marginTop: "3px",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {item.description.replace(/Xem thêm$/, "")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span
                            style={{
                              background: "#eef6f1",
                              color: "#2a7049",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#555" }}>{item.duration}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <strong style={{ color: "#f47722", fontSize: "15px" }}>{item.price}</strong>
                          <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>Đã gồm VAT</div>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <Link
                              href={`/dich-vu/${item.slug}`}
                              style={{
                                padding: "6px 10px",
                                fontSize: "12px",
                                border: "1px solid #326e51",
                                color: "#326e51",
                                borderRadius: "4px",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                fontWeight: 500,
                              }}
                            >
                              Chi tiết
                            </Link>
                            <Link
                              href={item.booking}
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                background: "#f47722",
                                color: "white",
                                borderRadius: "4px",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                                fontWeight: "bold",
                              }}
                            >
                              Đặt hẹn
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#888" }}>
                      Không tìm thấy dịch vụ nào phù hợp với từ khóa &ldquo;{keyword}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medical Disclaimer & Guarantees */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #d5e4db",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "36px",
          }}
        >
          <h2 style={{ fontSize: "17px", fontWeight: "bold", color: "#245b40", margin: "0 0 14px" }}>
            LƯU Ý Y KHOA QUAN TRỌNG &amp; CHÍNH SÁCH BẢO HÀNH TẠI HASAKI CLINIC &amp; SPA
          </h2>
          <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.8", fontSize: "13px", color: "#444" }}>
            <li>
              <strong>100% Bác sĩ Da Liễu khám miễn phí:</strong> Khách hàng luôn được Bác sĩ Da Liễu soi da, đánh giá độ nhạy cảm và tư vấn phác đồ chuẩn y khoa trước khi bắt đầu bất kỳ liệu trình nào.
            </li>
            <li>
              <strong>Quy chuẩn vô trùng nghiêm ngặt:</strong> Mỗi khách hàng được sử dụng 01 bộ dụng cụ y tế riêng biệt đã qua tiệt trùng chuẩn hấp sấy y tế, ngăn ngừa 100% nguy cơ lây nhiễm chéo.
            </li>
            <li>
              <strong>Bảo hành triệt lông 5 năm:</strong> Gói triệt lông Diode Laser trọn gói được cấp thẻ bảo hành 5 năm bằng văn bản, cam kết không phát sinh bất kỳ khoản phí nào trong thời gian bảo hành.
            </li>
            <li>
              <strong>Bảo hành lấy mụn 3 ngày:</strong> Khách hàng sử dụng dịch vụ lấy mụn chuẩn y khoa được tái khám và xử lý dặm lại miễn phí trong vòng 3 ngày nếu phát hiện còn sót nhân mụn.
            </li>
            <li>
              <strong>Giá niêm yết trọn gói:</strong> Chi phí trong bảng giá đã bao gồm vật tư y tế, thuốc bôi làm dịu và thuế VAT. Phòng khám cam kết không chèo kéo hoặc ép buộc mua thêm sản phẩm.
            </li>
            <li>
              <strong>Hotline hỗ trợ &amp; đặt lịch khám:</strong> Tổng đài <a href="tel:18006324" style={{ color: "#326e51", fontWeight: "bold" }}>1800 6324</a> (nhấn phím 2 - Miễn phí) hoạt động từ 09:00 - 20:00 hằng ngày.
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { categorizeClinicService, clinicServices as defaultClinicServices, type ClinicServiceItem } from "@/lib/clinic-services";

const amount = (value: string) => Number(value.replace(/[^0-9]/g, ""));
const sorts = [
  ["position", "Mới nhất"],
  ["topsale", "Bán chạy"],
  ["price_asc", "Giá thấp đến cao"],
  ["price_desc", "Giá cao đến thấp"],
] as const;

const CLINIC_FILTER_CATEGORIES = [
  "Điều Trị Mụn & Sẹo",
  "Triệt Lông Diode Laser",
  "Trẻ Hóa & Công Nghệ Cao",
  "Chăm Sóc & Thư Giãn",
] as const;

const DURATION_OPTIONS = [
  "Tất cả thời lượng",
  "Dưới 45 phút",
  "45 - 60 phút",
  "Trên 60 phút",
] as const;

function getDurationMinutes(durStr: string): number {
  const match = durStr.match(/(\d+)\s*(?:-|đến)?\s*(\d+)?\s*phút/i);
  if (!match) return 30;
  if (match[2]) {
    return (Number(match[1]) + Number(match[2])) / 2;
  }
  return Number(match[1]);
}

export function ClinicView({ sort, services = defaultClinicServices }: { sort: string; services?: ClinicServiceItem[] }) {
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [range, setRange] = useState<[number, number]>([0, Infinity]);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [keyword, setKeyword] = useState("");
  const [selectedDuration, setSelectedDuration] = useState<string>("Tất cả thời lượng");

  const items = services
    .filter(item => {
      if (!item.booking) return false;
      const p = amount(item.price);
      if (p < range[0] || p > range[1]) return false;

      if (selectedCategory !== "Tất cả") {
        if (categorizeClinicService(item.name) !== selectedCategory) return false;
      }

      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(kw);
        const matchDesc = item.description.toLowerCase().includes(kw);
        if (!matchName && !matchDesc) return false;
      }

      if (selectedDuration !== "Tất cả thời lượng") {
        const mins = getDurationMinutes(item.duration);
        if (selectedDuration === "Dưới 45 phút" && mins >= 45) return false;
        if (selectedDuration === "45 - 60 phút" && (mins < 45 || mins > 60)) return false;
        if (selectedDuration === "Trên 60 phút" && mins <= 60) return false;
      }

      return true;
    })
    .sort((a, b) =>
      sort === "price_asc"
        ? amount(a.price) - amount(b.price)
        : sort === "price_desc"
        ? amount(b.price) - amount(a.price)
        : 0
    );

  function applyPrice() {
    const low = min ? Number(min) : 0;
    const high = max ? Number(max) : Infinity;
    if (!Number.isFinite(low) || low < 0 || Number.isNaN(high) || high < low) {
      setError("Vui lòng nhập khoảng giá hợp lệ.");
      return;
    }
    setError("");
    setRange([low, high]);
  }

  function resetAllFilters() {
    setMin("");
    setMax("");
    setRange([0, Infinity]);
    setError("");
    setSelectedCategory("Tất cả");
    setKeyword("");
    setSelectedDuration("Tất cả thời lượng");
  }

  const isFiltered =
    range[0] !== 0 ||
    range[1] !== Infinity ||
    selectedCategory !== "Tất cả" ||
    keyword.trim() !== "" ||
    selectedDuration !== "Tất cả thời lượng";

  return (
    <>
      <Header />
      <nav className="booking-clinic-nav" aria-label="Nari Clinic & Spa">
        <div className="wrap">
          <Link href="/danh-muc/nari-clinic-spa.html">Nari Clinic & Spa &amp; SPA</Link>
          <Link href="/ho-tro/gioi-thieu">GIỚI THIỆU</Link>
          <Link href="/danh-muc/nari-clinic-spa.html">DỊCH VỤ</Link>
          <Link href="/bang-gia-dich-vu.html">BẢNG GIÁ</Link>
          <Link href="/cam-nang.html">CẨM NANG</Link>
          <Link href="/ho-tro/lien-he">LIÊN HỆ</Link>
          <Link href="/booking">ĐẶT HẸN</Link>
        </div>
      </nav>

      <main className="wrap clinic-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Nari Clinic & Spa &amp; Spa
        </div>

        <Image
          className="clinic-banner"
          src="https://media.hcdn.vn/catalog/category/1787211720369-dieu-tri-da-chuan-y-khoa-1-1787215476.jpg"
          alt="Nari Clinic & Spa"
          width={1320}
          height={250}
          unoptimized
        />

        <div className="listing">
          <aside className="filters clinic-filters">
            <h3>Nari Clinic & Spa &amp; SPA</h3>
            <div className="category-filter-list" style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
              <button
                type="button"
                className={selectedCategory === "Tất cả" ? "filter-active" : ""}
                style={{
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: selectedCategory === "Tất cả" ? "bold" : "normal",
                  color: selectedCategory === "Tất cả" ? "#328157" : "#333",
                  fontSize: "12px",
                  padding: "4px 0",
                }}
                onClick={() => setSelectedCategory("Tất cả")}
              >
                Tất cả chuyên khoa
              </button>
              {CLINIC_FILTER_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={selectedCategory === cat ? "filter-active" : ""}
                  style={{
                    textAlign: "left",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: selectedCategory === cat ? "bold" : "normal",
                    color: selectedCategory === cat ? "#328157" : "#333",
                    fontSize: "12px",
                    padding: "4px 0",
                  }}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "Tất cả" : cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <h3>TÌM KIẾM DỊCH VỤ</h3>
            <div style={{ margin: "8px 0 14px" }}>
              <input
                type="text"
                aria-label="Tìm dịch vụ phòng khám"
                placeholder="Tìm dịch vụ phòng khám..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  fontSize: "12px",
                }}
              />
            </div>

            <h3>THỜI LƯỢNG</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", margin: "8px 0 14px" }}>
              {DURATION_OPTIONS.map(opt => (
                <label
                  key={opt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="clinic-duration"
                    value={opt}
                    checked={selectedDuration === opt}
                    onChange={() => setSelectedDuration(opt)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <h3>KHOẢNG GIÁ</h3>
            <div className="new-price">
              <input
                aria-label="Giá từ"
                type="number"
                min="0"
                placeholder="₫ TỪ"
                value={min}
                onChange={e => setMin(e.target.value)}
              />
              <span>–</span>
              <input
                aria-label="Giá đến"
                type="number"
                min="0"
                placeholder="₫ ĐẾN"
                value={max}
                onChange={e => setMax(e.target.value)}
              />
            </div>
            <button type="button" className="clinic-apply" onClick={applyPrice}>
              Áp dụng
            </button>
            {error && <p role="alert" style={{ color: "#d9381e", fontSize: "12px", marginTop: "6px" }}>{error}</p>}
            {isFiltered && (
              <button
                type="button"
                onClick={resetAllFilters}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  border: "1px solid #ddd",
                  background: "#f9f9f9",
                  padding: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </aside>

          <div className="listing-main">
            <div className="listing-header">
              <h1>Nari Clinic & Spa &amp; Spa</h1>
              <span>({items.length} dịch vụ trong ảnh chụp)</span>
            </div>
            <p className="bestseller-notice">
              42 dịch vụ ghi nhận ngày 13/11/2026; giá và tình trạng có thể thay đổi. Mới nhất và Bán chạy giữ thứ tự ghi nhận, không phải dữ liệu cập nhật.
            </p>

            <div className="listing-sort" aria-label="Sắp xếp dịch vụ">
              {sorts.map(([value, label]) => (
                <Link
                  key={value}
                  className={sort === value ? "selected" : ""}
                  aria-current={sort === value ? "page" : undefined}
                  href={`/danh-muc/nari-clinic-spa.html?sort=${value}`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {items.length ? (
              <div className="clinic-service-grid">
                {items.map(item => (
                  <article className="clinic-service-card" key={item.url}>
                    <Link href={`/dich-vu/${item.url.split("/").pop()}`}>
                      <small>{categorizeClinicService(item.name)}</small>
                      <h2>{item.name}</h2>
                      <Image
                        src={item.image || ""}
                        alt={item.name}
                        width={380}
                        height={380}
                        unoptimized
                      />
                      <strong>{item.price}</strong>
                      <p>{item.duration}</p>
                    </Link>
                    <p className="clinic-description">
                      {item.description.replace(/Xem thêm$/, "")}{" "}
                      <Link href={`/dich-vu/${item.url.split("/").pop()}`}>Xem thêm</Link>
                    </p>
                    <div className="clinic-card-actions">
                      <a href="tel:18006324">
                        1800 6324
                        <br />
                        <small>(nhấn phím 2)</small>
                      </a>
                      <Link href={item.booking}>Đặt hẹn</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-list">Không có dịch vụ phù hợp với tiêu chí đã chọn.</p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/sites/nari/header";
import { Footer } from "@/components/sites/nari/footer";
import { getNewArrivals } from "@/lib/new-arrivals";
import type { LiveCatalogOverridesState } from "@/lib/live-catalog";

const amount = (value: string) => Number(value.replace(/[^0-9]/g, ""));
const sorts = [["position", "Mới nhất"], ["topsale", "Bán chạy"], ["price_asc", "Giá thấp đến cao"], ["price_desc", "Giá cao đến thấp"]] as const;
const categoryLinks = [
  ["Sức Khỏe - Làm Đẹp", "suc-khoe-lam-dep-c3.html", false], ["Thời Trang", "thoi-trang-c2351.html", true],
  ["Nhà Cửa & Đời Sống", "gia-dung-doi-song-c2440.html", true], ["Điện Lạnh & Điện Máy", "dien-lanh-dien-may-c2981.html", false],
  ["Điện Gia Dụng", "dien-gia-dung-c2761.html", false], ["Điện Thoại & Máy Tính Bảng", "dien-thoai-may-tinh-bang-c2926.html", false],
  ["Thiết Bị Điện Tử", "dien-tu-phu-kien-c2673.html", false], ["Sản Phẩm Cho Bé", "san-pham-cho-be-c2497.html", true],
  ["DermaHair", "dermahair-c2298.html", false],
] as const;

export function NewArrivals({ initialSort, liveCatalog }: { initialSort: string; liveCatalog?: LiveCatalogOverridesState }) {
  const snapshot = getNewArrivals(liveCatalog);
  const router = useRouter();
  const [sort, setSort] = useState(initialSort);
  const [brand, setBrand] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [range, setRange] = useState<[number, number]>([0, Infinity]);
  const [error, setError] = useState("");
  const brands = [...new Set(snapshot.map(item => item.brand))].filter(Boolean);
  const items = snapshot.filter(item => (!brand || item.brand === brand) && amount(item.price) >= range[0] && amount(item.price) <= range[1]).slice().sort((a, b) => sort === "price_asc" ? amount(a.price) - amount(b.price) : sort === "price_desc" ? amount(b.price) - amount(a.price) : 0);
  function applyPrice() {
    const low = min ? Number(min) : 0;
    const high = max ? Number(max) : Infinity;
    if (!Number.isFinite(low) || low < 0 || high < 0 || Number.isNaN(high) || low > high) { setError("Vui lòng nhập khoảng giá hợp lệ."); return; }
    setError(""); setRange([low, high]);
  }
  function changeSort(value: string) { setSort(value); router.replace(`/hang-moi-ve.html?sort=${value}`, { scroll: false }); }

  return <><Header /><main className="wrap new-arrivals">
    <div className="breadcrumbs"><Link href="/">Trang chủ</Link> › Hàng Mới Về - Bạt Ngàn Quà Tặng</div>
    <div className="listing"><aside className="filters new-arrivals-filters">
      <h3>DANH MỤC</h3>{categoryLinks.map(([name, slug]) => <Link key={slug} href={`/danh-muc/${slug}`}>{name}</Link>)}
      <h3>KHOẢNG GIÁ</h3><div className="new-price"><input aria-label="Giá từ" type="number" min="0" placeholder="₫ TỪ" value={min} onChange={e => setMin(e.target.value)} /><span>–</span><input aria-label="Giá đến" type="number" min="0" placeholder="₫ ĐẾN" value={max} onChange={e => setMax(e.target.value)} /></div><button className="new-apply" type="button" onClick={applyPrice}>Áp dụng</button>{error && <p role="alert">{error}</p>}
      <h3>THƯƠNG HIỆU</h3>{brands.map(name => <label key={name}><input type="radio" name="new-brand" checked={brand === name} onChange={() => setBrand(name)} /> {name}</label>)}{(brand || range[0] !== 0 || range[1] !== Infinity) && <button type="button" onClick={() => { setBrand(""); setMin(""); setMax(""); setRange([0, Infinity]); setError(""); }}>Xóa bộ lọc</button>}
    </aside><div className="listing-main"><div className="listing-header"><h1>Hàng Mới Về - Bạt Ngàn Quà Tặng</h1><span>({items.length} sản phẩm trong ảnh chụp)</span></div>
      <p className="bestseller-notice">Dữ liệu 40 sản phẩm ghi nhận ngày 13/11/2026, có thể đã thay đổi. Lọc và sắp xếp chỉ áp dụng cho dữ liệu này; chưa có thứ hạng bán chạy.</p>
      <div className="listing-sort" role="group" aria-label="Sắp xếp sản phẩm">{sorts.map(([value, label]) => <button key={value} type="button" className={sort === value ? "selected" : ""} aria-pressed={sort === value} onClick={() => changeSort(value)}>{label}</button>)}</div>
      {items.length ? <div className="new-arrivals-grid">{items.map(item => <Link className="new-arrival-card" key={item.url} href={`/san-pham/${item.url.split("/").pop()}`}><Image src={item.image} alt={item.name} width={380} height={380} unoptimized /><div><p><strong>{item.price}</strong> <del>{item.old}</del></p><b>{item.brand}</b><h2>{item.name}</h2><p>{item.description}</p></div></Link>)}</div> : <p className="empty-list">Không có sản phẩm phù hợp trong dữ liệu đã lưu.</p>}
    </div></div></main><Footer /></>;
}

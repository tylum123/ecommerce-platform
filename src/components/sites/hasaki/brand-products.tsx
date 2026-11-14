"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories, money } from "@/lib/catalog";
import { filterBrandProducts } from "@/lib/brand-filter";

export interface BrandProductItem {
  id?: number | string;
  sku?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  old: number;
  sale: number;
  slug: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  sold?: number;
  isSample?: boolean;
}

export function BrandProducts({
  name,
  items,
  deals,
  isRealSnapshot = false,
}: {
  name: string;
  items: BrandProductItem[];
  deals: boolean;
  isRealSnapshot?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [range, setRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null,
  });
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"default" | "low" | "high">("default");

  const options = categories.filter(([, slug]) =>
    items.some(item => item.category === slug)
  );

  const list = filterBrandProducts(items, {
    query,
    category,
    min: range.min,
    max: range.max,
    deals,
    sort,
  });

  function reset() {
    setQuery("");
    setCategory("");
    setMin("");
    setMax("");
    setRange({ min: null, max: null });
    setSort("default");
    setError("");
  }

  function applyRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const from = min === "" ? null : Number(min);
    const to = max === "" ? null : Number(max);
    if (
      (from !== null && (!Number.isFinite(from) || from < 0)) ||
      (to !== null && (!Number.isFinite(to) || to < 0)) ||
      (from !== null && to !== null && from > to)
    ) {
      setError("Khoảng giá không hợp lệ.");
      return;
    }
    setError("");
    setRange({ min: from, max: to });
  }

  return (
    <>
      <nav className="brand-detail-nav" aria-label="Thương hiệu">
        <Link href="/thuong-hieu">Thương hiệu</Link>
        <a className={!deals ? "active" : ""} href="?tab=Product">
          Sản phẩm
        </a>
        <a className={deals ? "active" : ""} href="?tab=Deal">
          Deals
        </a>
      </nav>

      <div className="brand-detail-banner" aria-label="Banner thương hiệu minh họa">
        <strong>{name}</strong>
        <span>KHÁM PHÁ SẢN PHẨM THƯƠNG HIỆU CHÍNH HÃNG</span>
      </div>

      <div className="brand-detail-listing">
        <aside className="brand-detail-filters">
          <h2>KHOẢNG GIÁ</h2>
          <form onSubmit={applyRange}>
            <label>
              Giá từ{" "}
              <input
                type="number"
                min="0"
                aria-label="Giá từ"
                value={min}
                onChange={event => setMin(event.target.value)}
              />
            </label>
            <label>
              Giá đến{" "}
              <input
                type="number"
                min="0"
                aria-label="Giá đến"
                value={max}
                onChange={event => setMax(event.target.value)}
              />
            </label>
            <button type="submit">Áp dụng</button>
            {error && <p role="alert">{error}</p>}
          </form>

          <h2>DANH MỤC</h2>
          <label>
            <input
              type="radio"
              name="brand-category"
              checked={!category}
              onChange={() => setCategory("")}
            />{" "}
            Tất cả
          </label>
          {options.map(([label, slug]) => (
            <label key={slug}>
              <input
                type="radio"
                name="brand-category"
                checked={category === slug}
                onChange={() => setCategory(slug)}
              />{" "}
              {label}
            </label>
          ))}
          <button type="button" onClick={reset}>
            Xóa bộ lọc
          </button>
        </aside>

        <section id="brand-products" className="brand-detail-products">
          <div className="brand-store-search">
            <label htmlFor="brand-search">Tìm kiếm trong cửa hàng</label>
            <input
              id="brand-search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm"
            />
          </div>

          <div className="brand-detail-sort" role="group" aria-label="Sắp xếp sản phẩm">
            {(
              [
                ["default", "Mặc định"],
                ["low", "Giá thấp đến cao"],
                ["high", "Giá cao đến thấp"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={sort === value ? "selected" : ""}
                aria-pressed={sort === value}
                onClick={() => setSort(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="section-title">
            <h2>
              {deals ? "Deals" : "Sản phẩm"} {name}
            </h2>
            <span aria-live="polite">{list.length} sản phẩm mẫu</span>
          </div>

          {deals && (
            <p className="demo-note">
              Deals chỉ lọc sản phẩm mẫu có giá giảm; không phản ánh chương trình thực tế.
            </p>
          )}

          {isRealSnapshot && (
            <div
              style={{
                fontSize: 12,
                color: "#2e7d32",
                background: "#f1f8e9",
                border: "1px solid #c8e6c9",
                borderRadius: 4,
                padding: "8px 12px",
                margin: "10px 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>✓</span>
              <span>
                Dữ liệu sản phẩm thực tế được đồng bộ từ gian hàng chính hãng <strong>{name}</strong> trên Hasaki.vn (tháng 11/2026).
              </span>
            </div>
          )}

          {list.length ? (
            <div className="product-grid">
              {list.map(product => (
                <Link
                  className="product"
                  href={`/san-pham/${product.slug}`}
                  key={product.slug}
                >
                  <div
                    className="product-picture"
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={240}
                        height={240}
                        unoptimized
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          padding: 8,
                        }}
                      />
                    ) : (
                      <>
                        <span>ẢNH SẢN PHẨM</span>
                        <b>{product.brand}</b>
                      </>
                    )}
                  </div>
                  <div className="product-content">
                    <div className="price-row">
                      <strong>{money(product.price)}</strong>
                      <span>-{product.sale}%</span>
                    </div>
                    <del>{money(product.old)}</del>
                    <small>{product.brand}</small>
                    <p>{product.name}</p>
                    {product.rating ? (
                      <div className="rating">
                        ★ {product.rating.toFixed(1)}{" "}
                        {product.reviewCount ? <span>({product.reviewCount})</span> : null}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p role="status">Không tìm thấy sản phẩm mẫu phù hợp.</p>
          )}
        </section>
      </div>
    </>
  );
}

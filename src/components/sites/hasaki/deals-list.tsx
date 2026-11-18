"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/sites/hasaki/product-card";
import type { DealProduct } from "@/lib/deals-bestsellers";
import type { Product } from "@/lib/catalog";

export function DealsList({ items }: { items: readonly DealProduct[] }) {
  const [search, setSearch] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [sortBy, setSortBy] = useState<"topsale" | "low" | "high" | "discount">("topsale");

  const brands = useMemo(() => {
    return Array.from(new Set(items.map(p => p.brand))).filter(Boolean).sort();
  }, [items]);

  const displayedItems = useMemo(() => {
    let result = items.slice();

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
      );
    }

    if (selectedBrand) {
      result = result.filter(p => p.brand === selectedBrand);
    }

    if (sortBy === "low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "discount") {
      result.sort((a, b) => b.sale - a.sale);
    }

    return result;
  }, [items, search, selectedBrand, sortBy]);

  return (
    <div className="deals-wrapper">
      {/* Controls toolbar */}
      <div
        className="deals-controls"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
          justifyContent: "space-between",
          background: "white",
          padding: "12px 16px",
          borderRadius: "4px",
          marginBottom: "16px"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm sản phẩm deal..."
            aria-label="Tìm kiếm deal"
            style={{
              padding: "6px 12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "13px",
              minWidth: "220px"
            }}
          />
          {brands.length > 1 && (
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              aria-label="Lọc theo thương hiệu"
              style={{
                padding: "6px 10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "13px",
                background: "white"
              }}
            >
              <option value="">Tất cả thương hiệu ({brands.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          )}
          {(search || selectedBrand) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedBrand("");
              }}
              style={{
                border: "none",
                background: "none",
                color: "#b86b4b",
                cursor: "pointer",
                fontSize: "12px",
                textDecoration: "underline"
              }}
            >
              Xóa lọc
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
          <span style={{ color: "#777" }}>Sắp xếp:</span>
          {(
            [
              { id: "topsale", label: "Bán chạy" },
              { id: "low", label: "Giá thấp" },
              { id: "high", label: "Giá cao" },
              { id: "discount", label: "Giảm sâu" }
            ] as const
          ).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSortBy(opt.id)}
              style={{
                border: "1px solid",
                borderColor: sortBy === opt.id ? "#b86b4b" : "#ddd",
                background: sortBy === opt.id ? "#fff7ed" : "white",
                color: sortBy === opt.id ? "#b86b4b" : "#444",
                padding: "5px 10px",
                borderRadius: "3px",
                fontSize: "12px",
                fontWeight: sortBy === opt.id ? "bold" : "normal"
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {displayedItems.length ? (
        <div className="deals-grid">
          {displayedItems.map(product => {
            const percent = product.deal?.bought_percent ?? product.progress ?? 50;
            return (
              <div className="deals-item" key={product.slug} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <ProductCard product={{ ...(product as Product), progress: percent }} />
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-list">Chưa có sản phẩm mẫu trong danh mục này.</p>
      )}
    </div>
  );
}

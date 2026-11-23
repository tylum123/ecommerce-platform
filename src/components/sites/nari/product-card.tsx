"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ShoppingCart } from "lucide-react";
import { money, type Product } from "@/lib/catalog";
import { addToCart } from "@/lib/cart";
import {
  computeGiftBillPromo,
  computeProductEnglishSubtitle,
} from "@/lib/interactive-ui";
import {
  handleSmoothImageError,
  handleSmoothImageLoad,
  syncCachedImageRef,
} from "@/lib/smooth-image";

export function ProductCard({
  product,
}: {
  product: Product & { progress?: number };
  showSampleRating?: boolean;
}) {
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleQuickAdd = () => {
    addToCart(product.slug, 1, { name: product.name });
    setAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), 1500);
  };

  const englishSubtitle =
    (product.catalogSource === "postgres"
      ? product.englishName
      : product.englishName ?? computeProductEnglishSubtitle(product)) || "";
  const giftBill = product.catalogSource === "postgres" ? null : computeGiftBillPromo(product);
  const hasRealRating = typeof product.rating === "number" && product.rating > 0;
  const hasRealReviews =
    typeof product.reviewCount === "number" && product.reviewCount >= 0;
  const hasRealSold = typeof product.sold === "number" && product.sold > 0;

  return (
    <article className="product flex flex-col">
      <Link className="block flex-1" href={`/san-pham/${product.slug}`}>
      <div
        className={product.image ? "product-picture nari-img-frame" : "product-picture"}
        data-img-frame={product.image ? "true" : undefined}
        style={{ position: "relative" }}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={220}
            height={220}
            loading="lazy"
            unoptimized
            className="nari-smooth-img"
            ref={syncCachedImageRef}
            onLoad={handleSmoothImageLoad}
            onError={handleSmoothImageError}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 4,
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
        <div
          className="price-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
            marginBottom: product.old > product.price ? 2 : 4,
          }}
        >
          <strong style={{ whiteSpace: "nowrap" }}>{money(product.price)}</strong>
          {product.sale > 0 && <span style={{ whiteSpace: "nowrap" }}>-{product.sale}%</span>}
        </div>
        {product.old > product.price && (
          <del
            style={{
              display: "block",
              margin: "0 0 4px",
              fontSize: 11,
              color: "#9ca3af",
              whiteSpace: "nowrap",
            }}
          >
            {money(product.old)}
          </del>
        )}

        <small
          style={{
            fontWeight: 700,
            color: "#3d2e24",
            fontSize: 12,
            marginBottom: 2,
          }}
        >
          {product.brand}
        </small>

        {/* English Product Subtitle (1:1 Nari Home Card Format) */}
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: "#1f2937",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 2,
          }}
          title={englishSubtitle}
        >
          {englishSubtitle}
        </div>

        <p>{product.name}</p>

        {/* Rating Badge + Reviews + Monthly Cart Velocity (Strictly from snapshot data) */}
        {(hasRealRating || hasRealSold) && (
          <div
            className="rating"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 4,
              fontSize: 11,
              marginTop: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {hasRealRating && (
                <span
                  style={{
                    background: "#b86b4b",
                    color: "#ffffff",
                    fontWeight: 700,
                    borderRadius: 3,
                    padding: "1px 5px",
                    fontSize: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {product.rating} ★
                </span>
              )}
              {hasRealReviews && (
                <span style={{ color: "#6b7280" }}>({product.reviewCount})</span>
              )}
            </div>
            {hasRealSold && (
              <span style={{ color: "#6b7280", fontSize: 10.5 }}>
                🛒 {product.sold}
              </span>
            )}
          </div>
        )}

        {/* Dashed Terracotta Gift Bill Tag */}
        {giftBill && <div
          style={{
            marginTop: 6,
            padding: "2px 6px",
            border: "1px dashed #b86b4b",
            background: "#fbf0ea",
            color: "#b86b4b",
            borderRadius: 3,
            fontSize: 10,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={giftBill.fullText}
        >
          {giftBill.badgeText}
        </div>}

        {typeof product.progress === "number" && (
          <div className="progress" style={{ marginTop: 8 }}>
            <i style={{ width: `${product.progress}%` }}></i>
            <span>Đã bán {product.progress}%</span>
          </div>
        )}
      </div>
      </Link>
      <div className="px-2.5 pb-2.5 pt-1">
        <button
          type="button"
          onClick={handleQuickAdd}
          className={`product-quick-add${added ? " added" : ""}`}
          aria-label={`Thêm nhanh ${product.name} vào giỏ hàng`}
        >
          {added ? <Check size={14} /> : <ShoppingCart size={14} />}
          <span>{added ? "Đã thêm" : "Thêm vào giỏ"}</span>
        </button>
      </div>
    </article>
  );
}

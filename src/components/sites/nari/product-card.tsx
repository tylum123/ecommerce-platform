import Link from "next/link";
import Image from "next/image";
import { money, type Product } from "@/lib/catalog";
import {
  computeGiftBillPromo,
  computeProductEnglishSubtitle,
} from "@/lib/interactive-ui";

export function ProductCard({
  product,
}: {
  product: Product & { progress?: number };
  showSampleRating?: boolean;
}) {
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
    <Link className="product" href={`/san-pham/${product.slug}`}>
      <div className="product-picture" style={{ position: "relative" }}>
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            width={220}
            height={220}
            unoptimized
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
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <strong>{money(product.price)}</strong>
            {product.old > product.price && (
              <del style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                {money(product.old)}
              </del>
            )}
          </div>
          {product.sale > 0 && <span>-{product.sale}%</span>}
        </div>

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
  );
}

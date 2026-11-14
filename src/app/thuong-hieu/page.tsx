import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import brands from "../../../docs/research/hasaki/brands-source.json";
import { getBrandEnhancements } from "@/lib/product-details";

const letters = ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

const FEATURED_KEYS = [
  "bioderma.html",
  "cerave.html",
  "cocoon.html",
  "klairs.html",
  "skin1004.html",
  "l-oreal.html",
  "hada-labo.html",
  "la-roche-posay.html",
  "vaseline.html",
  "dove.html",
  "eucerin.html",
  "vichy.html",
  "anker.html",
];

export default function BrandsPage() {
  const enhancements = getBrandEnhancements();
  const populatedLetters = letters.filter(letter =>
    brands.some(brand =>
      letter === "0-9"
        ? /^[0-9]/.test(brand.name)
        : brand.name.toUpperCase().startsWith(letter)
    )
  );

  const featuredBrands = FEATURED_KEYS.map(slug => {
    const item = brands.find(b => b.url === `/thuong-hieu/${slug}`);
    const key = slug.replace(".html", "").toLowerCase();
    const meta = enhancements[key] || enhancements[slug] || {};
    return {
      name: item?.name || meta.name || key,
      url: `/thuong-hieu/${slug}`,
      logo: meta.logo || "",
      productCount: meta.productCount || 0,
    };
  }).filter(b => Boolean(b.name));

  return (
    <>
      <Header />
      <main className="wrap brands-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › Thương hiệu
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
          <h1>Xem {brands.length} thương hiệu chính hãng</h1>
          <span style={{ fontSize: 13, color: "#666" }}>Cam kết 100% chính hãng • Đầy đủ hoá đơn VAT</span>
        </div>

        {/* Featured Brands Strip */}
        <section aria-label="Thương hiệu nổi bật" style={{ margin: "16px 0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: "bold", margin: 0, color: "#326e51", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Thương hiệu nổi bật
            </h2>
            <span style={{ fontSize: 12, color: "#888" }}>Cập nhật theo dữ liệu thực tế Hasaki</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: 12,
            }}
          >
            {featuredBrands.map(b => (
              <Link
                key={b.url}
                href={b.url}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "12px 8px",
                  textAlign: "center",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 50,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}
                >
                  {b.logo ? (
                    <Image
                      src={b.logo}
                      alt={b.name}
                      width={100}
                      height={48}
                      unoptimized
                      style={{ objectFit: "contain", maxHeight: 48, maxWidth: "100%" }}
                    />
                  ) : (
                    <span style={{ fontWeight: "bold", color: "#326e51", fontSize: 13 }}>{b.name}</span>
                  )}
                </div>
                <strong style={{ fontSize: 12, color: "#1f2937", lineHeight: 1.2 }}>{b.name}</strong>
                {b.productCount > 0 && (
                  <span style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    {b.productCount} sản phẩm
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Letter Navigation */}
        <nav className="brands-index" aria-label="Chọn chữ cái thương hiệu">
          {populatedLetters.map(letter => (
            <a href={`#brand-${letter}`} key={letter}>
              {letter}
            </a>
          ))}
        </nav>

        {/* Brand Groups By Letter */}
        {populatedLetters.map(letter => {
          const items = brands.filter(brand =>
            letter === "0-9"
              ? /^[0-9]/.test(brand.name)
              : brand.name.toUpperCase().startsWith(letter)
          );
          if (!items.length) return null;
          return (
            <section id={`brand-${letter}`} className="brand-group" key={letter}>
              <h2>{letter}</h2>
              <div className="brand-list">
                {items.map(brand => {
                  const slug = brand.url.replace("/thuong-hieu/", "");
                  const meta = enhancements[slug.toLowerCase()] || enhancements[brand.name.toLowerCase()];
                  const logoUrl = meta?.logo;
                  return (
                    <Link href={brand.url} key={brand.url}>
                      <span className="brand-list-image">
                        {logoUrl ? (
                          <Image
                            src={logoUrl}
                            alt={brand.name}
                            width={120}
                            height={60}
                            unoptimized
                            style={{ objectFit: "contain", maxHeight: 60, maxWidth: "100%" }}
                          />
                        ) : (
                          brand.name
                        )}
                      </span>
                      <span>{brand.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </>
  );
}

export const dynamic = "force-dynamic";
import { readStorefrontCatalog } from "@/lib/server/live-catalog-store";
import { applyCatalogOverrides } from "@/lib/live-catalog";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/sites/hasaki/header";
import { Footer } from "@/components/sites/hasaki/footer";
import { BrandProducts } from "@/components/sites/hasaki/brand-products";
import { getAllCatalogProducts } from "@/lib/catalog";
import { notFound } from "next/navigation";
import brands from "../../../../docs/research/hasaki/brands-source.json";
import interactiveUiRaw from "../../../../docs/research/hasaki/interactive-ui-2026-11-14.json";
import { getBrandMetadata, getBrandProductsSnapshot } from "@/lib/product-details";

const KNOWN_UI_BRAND_SLUGS: Record<string, string> = {
  "vichy": "Vichy",
  "dove": "Dove",
  "vaseline": "Vaseline",
  "eucerin": "Eucerin",
  "cocoon": "Cocoon",
  "cerave": "CeraVe",
  "bioderma": "Bioderma",
  "la-roche-posay": "La Roche-Posay",
  "l-oreal": "L'Oréal",
  "l-oreal-paris": "L'Oréal",
  "klairs": "Klairs",
  "skin1004": "Skin1004",
  "sunplay": "Sunplay",
  "anessa": "Anessa",
  "garnier": "Garnier",
  "paula-s-choice": "Paula's Choice",
  "obagi": "Obagi",
  "svr": "SVR",
  "avene": "Avène",
  "cetaphil": "Cetaphil",
  "simple": "Simple",
  "senka": "Senka",
  "hada-labo": "Hada Labo",
  "biore": "Bioré",
  "romand": "Rom&nd",
  "maybelline": "Maybelline",
  "mac": "M.A.C",
  "3ce": "3CE",
  "carslan": "Carslan",
  "judydoll": "Judydoll",
  "colorkey": "Colorkey",
  "unilever": "Unilever",
  "anker": "Anker",
  "lifebuoy": "Lifebuoy",
  "pantene": "Pantene",
  "head-shoulders": "Head & Shoulders",
  "tresemme": "TRESemmé",
  "ogx": "OGX",
  "tsubaki": "Tsubaki",
  "fino": "Fino",
  "mise-en-scene": "Mise En Scène",
  "naruko": "Naruko",
  "some-by-mi": "Some By Mi",
  "cosrx": "COSRX",
  "torriden": "Torriden",
  "round-lab": "Round Lab",
  "banobagi": "Banobagi",
  "mediheal": "Mediheal",
  "bnbg": "BNBG",
  "dhc": "DHC",
};

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const liveCatalog = await readStorefrontCatalog();
  if (liveCatalog.source === "postgres") {
    const brand = liveCatalog.references?.brands.find(item => item.slug === slug);
    if (!brand) notFound();
    const items = getAllCatalogProducts(liveCatalog).filter(product => product.brandId === brand.id);
    return <>
      <Header />
      <main className="wrap brand-detail-page">
        <div className="breadcrumbs"><Link href="/">Trang chủ</Link> › <Link href="/thuong-hieu">Thương hiệu</Link> › {brand.label}</div>
        <div className="brand-detail-heading">
          <div className="brand-detail-logo">{brand.label}</div>
          <div><h1>{brand.label}</h1><span>{items.length} sản phẩm</span><p>Chưa có mô tả đã xác minh cho thương hiệu {brand.label}.</p></div>
        </div>
        <BrandProducts name={brand.label} items={items} deals={tab === "Deal"} source="postgres" categoryOptions={(liveCatalog.references?.categories || []).map(item => [item.label, item.slug])} />
      </main>
      <Footer />
    </>;
  }

  const cleanSlug = slug.replace(/\.html$/i, "").toLowerCase();

  let matchedBrand: { name: string; url: string; image?: string } | undefined = brands.find(item => {
    const itemUrlClean = item.url.replace(/^\/thuong-hieu\//i, "").replace(/\.html$/i, "").toLowerCase();
    const itemNameSlug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return (
      item.url === `/thuong-hieu/${slug}` ||
      item.url === `/thuong-hieu/${cleanSlug}.html` ||
      item.url === `/thuong-hieu/${cleanSlug}` ||
      itemUrlClean === cleanSlug ||
      itemNameSlug === cleanSlug
    );
  });

  if (!matchedBrand) {
    const uiBrandName = KNOWN_UI_BRAND_SLUGS[cleanSlug];
    if (uiBrandName) {
      matchedBrand = { name: uiBrandName, url: `/thuong-hieu/${cleanSlug}.html`, image: "" };
    }
  }

  if (!matchedBrand) {
    const ui = interactiveUiRaw as {
      megaMenu?: Array<{ featuredBrands?: Array<{ name: string; href: string; logo?: string }> }>;
      searchPopup?: { suggestedBrands?: Array<{ name: string; href: string; logo?: string }> };
      categoryPageUi?: { brandBannerLogos?: Array<{ name: string; href: string; logo?: string }> };
    };
    const allUiBrands = [
      ...(ui.megaMenu || []).flatMap(m => m.featuredBrands || []),
      ...(ui.searchPopup?.suggestedBrands || []),
      ...(ui.categoryPageUi?.brandBannerLogos || []),
    ];
    const foundUi = allUiBrands.find(b => {
      const h = b.href.replace(/^\/thuong-hieu\//i, "").replace(/\.html$/i, "").toLowerCase();
      return h === cleanSlug;
    });
    if (foundUi) {
      matchedBrand = { name: foundUi.name, url: foundUi.href, image: foundUi.logo || "" };
    }
  }

  if (!matchedBrand) notFound();
  const brand = matchedBrand;

  const metadata =
    getBrandMetadata(slug) ||
    getBrandMetadata(`${cleanSlug}.html`) ||
    getBrandMetadata(cleanSlug);

  // 1. Core + full catalog products for this brand
  const allCatalog = getAllCatalogProducts(liveCatalog);
  const catalogItems = allCatalog.filter(
    product => product.brand.toLocaleLowerCase("vi") === brand.name.toLocaleLowerCase("vi")
  );

  // 2. Real scraped snapshot products for this brand
  const snapshotItems =
    getBrandProductsSnapshot(slug).length > 0
      ? getBrandProductsSnapshot(slug)
      : getBrandProductsSnapshot(`${cleanSlug}.html`).length > 0
        ? getBrandProductsSnapshot(`${cleanSlug}.html`)
        : getBrandProductsSnapshot(cleanSlug);

  // Merge, avoiding duplicates by slug
  const seenSlugs = new Set(catalogItems.map(p => p.slug));
  const mergedItems = [...catalogItems];
  for (const item of applyCatalogOverrides(snapshotItems, liveCatalog).filter((item) => item.brand.toLocaleLowerCase("vi") === brand.name.toLocaleLowerCase("vi"))) {
    if (!seenSlugs.has(item.slug)) {
      seenSlugs.add(item.slug);
      mergedItems.push(item);
    }
  }


  const brandDescription =
    metadata?.description ||
    (cleanSlug === "bioderma"
      ? "Bioderma là thương hiệu dược mỹ phẩm nổi tiếng hàng đầu của Pháp, được thành lập năm 1970 bởi dược sĩ Jean-Noel Thorel. Các sản phẩm của Bioderma được phát triển từ thành phần an toàn, lành tính bao gồm các sản phẩm như nước tẩy trang, kem dưỡng,... được hàng triệu người tin dùng trên toàn thế giới."
      : `Chưa có mô tả đã xác minh cho thương hiệu ${brand.name}.`);

  return (
    <>
      <Header />
      <main className="wrap brand-detail-page">
        <div className="breadcrumbs">
          <Link href="/">Trang chủ</Link> › <Link href="/thuong-hieu">Thương hiệu</Link> › {brand.name}
        </div>
        <div className="brand-detail-heading">
          <div className="brand-detail-logo">
            {metadata?.logo ? (
              <Image
                src={metadata.logo}
                alt={brand.name}
                width={120}
                height={60}
                unoptimized
                style={{ objectFit: "contain", maxHeight: 56, maxWidth: "100%" }}
              />
            ) : (
              brand.name
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1>{brand.name}</h1>
              <span
                style={{
                  fontSize: 12,
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "2px 8px",
                  borderRadius: 12,
                  fontWeight: "bold",
                }}
              >
                {metadata?.productCount && metadata.productCount > 0
                  ? `${metadata.productCount} sản phẩm chính hãng`
                  : `${mergedItems.length} sản phẩm chính hãng`}
              </span>
            </div>
            <p>{brandDescription}</p>
          </div>
        </div>

        <BrandProducts
          name={brand.name}
          items={mergedItems}
          deals={tab === "Deal"}
          isRealSnapshot={snapshotItems.length > 0 || catalogItems.length > 0}
        />
      </main>
      <Footer />
    </>
  );
}

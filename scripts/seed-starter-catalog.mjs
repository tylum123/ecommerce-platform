#!/usr/bin/env node
// Idempotent starter catalog, flagship branch & inventory seed for Nari Home.
// Load credentials via `node --env-file=.env scripts/seed-starter-catalog.mjs [--dry-run | --apply --image1 <path> --image2 <path>]`.
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function parseArgs(argv) {
  let mode = '';
  let image1 = '';
  let image2 = '';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      if (mode && mode !== 'dry-run') throw new Error('CONFLICTING_MODE_FLAGS');
      mode = 'dry-run';
    } else if (arg === '--apply') {
      if (mode && mode !== 'apply') throw new Error('CONFLICTING_MODE_FLAGS');
      mode = 'apply';
    } else if (arg === '--image1') {
      image1 = argv[++i] || '';
    } else if (arg === '--image2') {
      image2 = argv[++i] || '';
    } else {
      throw new Error(`UNKNOWN_ARGUMENT:${arg}`);
    }
  }

  if (!mode) {
    throw new Error('MODE_REQUIRED: specify --dry-run or --apply');
  }
  return { mode, image1, image2 };
}

function detectImageType(bytes) {
  if (bytes.length < 12 || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error('IMAGE_SIZE_INVALID');
  }
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, idx) => bytes[idx] === b)) {
    return { extension: 'png', mime: 'image/png' };
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: 'jpg', mime: 'image/jpeg' };
  }
  if (
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  ) {
    return { extension: 'webp', mime: 'image/webp' };
  }
  throw new Error('IMAGE_TYPE_INVALID');
}

function readPostgresConfig(env = process.env) {
  const urlString = (env.NARI_POSTGRES_URL || '').trim();
  if (!urlString) throw new Error('NARI_POSTGRES_URL_REQUIRED');
  const parsed = new URL(urlString);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || parsed.search) {
    throw new Error('NARI_POSTGRES_URL_INVALID');
  }
  return {
    connectionString: parsed.toString(),
    ssl: {
      rejectUnauthorized: true,
      ...(env.NARI_POSTGRES_CA ? { ca: env.NARI_POSTGRES_CA } : {}),
    },
    connectionTimeoutMillis: 8000,
    statement_timeout: 20000,
    application_name: 'nari-seed-starter',
  };
}

function readStorageConfig(env = process.env) {
  const supabaseUrl = (env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const bucket = (env.NARI_STORAGE_BUCKET || 'nari-catalog').trim();
  const publicOrigin = (env.NARI_STORAGE_PUBLIC_ORIGIN || supabaseUrl).trim();
  if (!supabaseUrl || !serviceRoleKey || !bucket || !publicOrigin) {
    throw new Error('STORAGE_CONFIG_REQUIRED');
  }
  const u = new URL(supabaseUrl);
  const o = new URL(publicOrigin);
  if (u.protocol !== 'https:' || o.origin !== u.origin) {
    throw new Error('STORAGE_ORIGIN_INVALID');
  }
  return { supabaseUrl: u.origin, serviceRoleKey, bucket, publicOrigin: o.origin };
}

function buildStarterDataset(image1Meta, image2Meta) {
  const brands = [
    { id: 'brand-nari-botanicals', name: 'Nari Botanicals', slug: 'nari-botanicals.html' },
    { id: 'brand-nari-lab', name: 'Nari Lab', slug: 'nari-lab.html' },
  ];

  const categories = [
    { id: 'cat-cham-soc-da-mat', name: 'Chăm Sóc Da Mặt', slug: 'cham-soc-da-mat-c4.html', displayOrder: 1 },
    { id: 'cat-sua-rua-mat', name: 'Sữa Rửa Mặt', slug: 'sua-rua-mat-c19.html', displayOrder: 2 },
  ];

  const products = [
    {
      id: 'prod-nari-serum-ha-b5',
      sku: 'NARI-SRM-001',
      slug: 'tinh-chat-phuc-hoi-cap-am-nari-silk-ha-b5-30ml-narisrm001.html',
      name: 'Tinh Chất Phục Hồi Cấp Ẩm Nari Silk HA B5 30ml',
      englishName: 'Nari Silk Hydra-Repair HA B5 Serum 30ml',
      brandSlug: 'nari-botanicals.html',
      categorySlug: 'cham-soc-da-mat-c4.html',
      price: 390000,
      marketPrice: 490000,
      description:
        'Tinh chất cấp ẩm đa tầng chứa Hyaluronic Acid phân tử kép và Vitamin B5 (Panthenol 5%) giúp làm dịu da nhạy cảm, phục hồi hàng rào ẩm và mang lại bề mặt da căng mọng mịn màng.',
      overviewHtml:
        'Tinh Chất Phục Hồi Cấp Ẩm Nari Silk HA B5 30ml kết hợp Hyaluronic Acid đa trọng lượng phân tử cùng 5% Panthenol tinh khiết, thẩm thấu nhanh không gây nhờn rít. Phù hợp chăm sóc hằng ngày và phục hồi da sau liệu trình clinic.',
      ingredientsHtml:
        'Aqua, Panthenol (5%), Sodium Hyaluronate, Hydrolyzed Hyaluronic Acid, Madecassoside, Glycerin, Niacinamide, Allantoin, Beta-Glucan.',
      usageHtml:
        'Sau bước làm sạch và toner, lấy 2-3 giọt tinh chất thoa đều lên mặt và cổ, vỗ nhẹ để dưỡng chất thẩm thấu. Sử dụng sáng và tối trước kem dưỡng ẩm.',
      image: image1Meta,
      altText: 'Tinh Chất Phục Hồi Cấp Ẩm Nari Silk HA B5 30ml',
      specs: [
        { label: 'Thương hiệu', value: 'Nari Botanicals' },
        { label: 'Xuất xứ', value: 'Hàn Quốc / Công thức độc quyền Nari Home' },
        { label: 'Dung tích', value: '30ml' },
        { label: 'Loại da phù hợp', value: 'Mọi loại da, đặc biệt da khô thiếu ẩm & nhạy cảm' },
        { label: 'Thành phần chính', value: 'Hyaluronic Acid đa phân tử, Vitamin B5 (Panthenol 5%), Madecassoside' },
        { label: 'Hạn sử dụng', value: '36 tháng kể từ ngày sản xuất' },
      ],
    },
    {
      id: 'prod-nari-calm-cleanser',
      sku: 'NARI-CLN-002',
      slug: 'sua-rua-mat-diu-nhe-can-bang-ph-nari-calm-gel-200ml-naricln002.html',
      name: 'Sữa Rửa Mặt Dịu Nhẹ Cân Bằng pH Nari Calm Gel 200ml',
      englishName: 'Nari Calm pH 5.5 Gentle Cleansing Gel 200ml',
      brandSlug: 'nari-lab.html',
      categorySlug: 'sua-rua-mat-c19.html',
      price: 245000,
      marketPrice: 295000,
      description:
        'Gel rửa mặt dịu nhẹ độ pH 5.5 chuẩn sinh lý da, làm sạch bụi mịn và dầu thừa hiệu quả mà vẫn giữ nguyên lớp màng ẩm tự nhiên, không gây khô căng sau khi rửa.',
      overviewHtml:
        'Sữa Rửa Mặt Dịu Nhẹ Cân Bằng pH Nari Calm Gel 200ml ứng dụng hệ chất hoạt động bề mặt dịu nhẹ từ axit amin dừa, kết hợp chiết xuất rau má và Ceramide NP giúp làm sạch êm dịu cho cả làn da treatment hoặc da dễ kích ứng.',
      ingredientsHtml:
        'Aqua, Sodium Cocoyl Glycinate, Coco-Betaine, Glycerin, Centella Asiatica Extract, Ceramide NP, Chamomilla Recutita Flower Extract, Citric Acid.',
      usageHtml:
        'Làm ướt mặt, lấy một lượng gel vừa đủ ra tay tạo bọt nhẹ với nước, massage theo chuyển động tròn trong 30-60 giây rồi rửa sạch với nước ấm.',
      image: image2Meta,
      altText: 'Sữa Rửa Mặt Dịu Nhẹ Cân Bằng pH Nari Calm Gel 200ml',
      specs: [
        { label: 'Thương hiệu', value: 'Nari Lab' },
        { label: 'Xuất xứ', value: 'Hàn Quốc' },
        { label: 'Dung tích', value: '200ml' },
        { label: 'Loại da phù hợp', value: 'Da nhạy cảm, da dầu mụn, da đang dùng treatment' },
        { label: 'Thành phần chính', value: 'Amino Acid Surfactants, Chiết xuất Rau Má, Ceramide NP (pH 5.5)' },
        { label: 'Hạn sử dụng', value: '36 tháng kể từ ngày sản xuất' },
      ],
    },
  ];

  const branch = {
    id: 'branch-hcm-q1',
    code: 'NARI-HCM-Q1',
    name: 'Nari Home Flagship — Quận 1',
    address: '88 Đồng Khởi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    city: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    phone: '18006324',
    supportsNowfree2h: true,
    supportsClinic: false,
  };

  return { brands, categories, products, branch };
}

async function uploadImageAsset(storageClient, bucket, publicOrigin, filePath, objectBaseName) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`IMAGE_NOT_FOUND:${absPath}`);
  }
  const bytes = fs.readFileSync(absPath);
  const type = detectImageType(bytes);
  const storagePath = `catalog/${objectBaseName}.${type.extension}`;
  const { data, error } = await storageClient.storage.from(bucket).upload(storagePath, bytes, {
    contentType: type.mime,
    upsert: true,
    cacheControl: '31536000',
  });
  if (error || data?.path !== storagePath) {
    throw new Error(`STORAGE_UPLOAD_FAILED:${storagePath}:${error?.message || 'unknown'}`);
  }
  return {
    url: `${publicOrigin}/storage/v1/object/public/${bucket}/${storagePath}`,
    bucket,
    storagePath,
    mime: type.mime,
    size: bytes.length,
  };
}

async function main() {
  const { mode, image1, image2 } = parseArgs(process.argv.slice(2));
  const pgConfig = readPostgresConfig();
  const storageConfig = readStorageConfig();

  if (mode === 'dry-run') {
    const preview1 = image1
      ? { ...detectImageType(fs.readFileSync(path.resolve(image1))), path: path.resolve(image1) }
      : { planned: 'catalog/starter-nari-serum-ha-b5.<ext>' };
    const preview2 = image2
      ? { ...detectImageType(fs.readFileSync(path.resolve(image2))), path: path.resolve(image2) }
      : { planned: 'catalog/starter-nari-calm-cleanser.<ext>' };
    const dataset = buildStarterDataset(
      { url: `${storageConfig.publicOrigin}/storage/v1/object/public/${storageConfig.bucket}/catalog/starter-nari-serum-ha-b5.png` },
      { url: `${storageConfig.publicOrigin}/storage/v1/object/public/${storageConfig.bucket}/catalog/starter-nari-calm-cleanser.png` }
    );
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          bucket: storageConfig.bucket,
          publicOrigin: storageConfig.publicOrigin,
          images: [preview1, preview2],
          counts: {
            brands: dataset.brands.length,
            categories: dataset.categories.length,
            products: dataset.products.length,
            branches: 1,
            inventoryBalances: dataset.products.length,
          },
          productSlugs: dataset.products.map((p) => p.slug),
        },
        null,
        2
      )
    );
    return;
  }

  if (!image1 || !image2) {
    throw new Error('IMAGES_REQUIRED: --apply requires both --image1 and --image2');
  }

  const supabase = createClient(storageConfig.supabaseUrl, storageConfig.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const [img1, img2] = await Promise.all([
    uploadImageAsset(supabase, storageConfig.bucket, storageConfig.publicOrigin, image1, 'starter-nari-serum-ha-b5'),
    uploadImageAsset(supabase, storageConfig.bucket, storageConfig.publicOrigin, image2, 'starter-nari-calm-cleanser'),
  ]);

  const dataset = buildStarterDataset(img1, img2);
  const client = new pg.Client(pgConfig);

  try {
    await client.connect();
    await client.query('BEGIN');

    const brandIds = new Map();
    for (const b of dataset.brands) {
      await client.query(
        'INSERT INTO nari_catalog.brands (id, name, slug) VALUES ($1, $2, $3) ON CONFLICT (slug) DO NOTHING',
        [b.id, b.name, b.slug]
      );
      const res = await client.query('SELECT id FROM nari_catalog.brands WHERE slug = $1', [b.slug]);
      brandIds.set(b.slug, String(res.rows[0].id));
    }

    const categoryIds = new Map();
    for (const c of dataset.categories) {
      await client.query(
        'INSERT INTO nari_catalog.categories (id, name, slug, display_order) VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING',
        [c.id, c.name, c.slug, c.displayOrder]
      );
      const res = await client.query('SELECT id FROM nari_catalog.categories WHERE slug = $1', [c.slug]);
      categoryIds.set(c.slug, String(res.rows[0].id));
    }

    const seededProducts = [];
    for (const p of dataset.products) {
      const brandId = brandIds.get(p.brandSlug);
      const categoryId = categoryIds.get(p.categorySlug);
      await client.query(
        `INSERT INTO nari_catalog.products (
          id, sku, slug, name, english_name, brand_id, category_id,
          price, market_price, description, overview_html, ingredients_html, usage_html
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (sku) DO NOTHING`,
        [
          p.id,
          p.sku,
          p.slug,
          p.name,
          p.englishName,
          brandId,
          categoryId,
          p.price,
          p.marketPrice,
          p.description,
          p.overviewHtml,
          p.ingredientsHtml,
          p.usageHtml,
        ]
      );
      const prodRes = await client.query('SELECT id, slug FROM nari_catalog.products WHERE sku = $1', [p.sku]);
      const productId = String(prodRes.rows[0].id);
      seededProducts.push({ id: productId, sku: p.sku, slug: String(prodRes.rows[0].slug), imageUrl: p.image.url });

      const existingImg = await client.query('SELECT 1 FROM nari_catalog.product_images WHERE product_id = $1 LIMIT 1', [
        productId,
      ]);
      if (existingImg.rows.length === 0) {
        await client.query(
          `INSERT INTO nari_catalog.product_images (id, product_id, url, alt_text, sort_order, storage_bucket, storage_path)
          VALUES ($1, $2, $3, $4, 0, $5, $6)`,
          [`${productId}:image:0`, productId, p.image.url, p.altText, p.image.bucket, p.image.storagePath]
        );
      }

      for (const [idx, spec] of p.specs.entries()) {
        await client.query(
          `INSERT INTO nari_catalog.product_specs (product_id, sort_order, label, value)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (product_id, sort_order) DO NOTHING`,
          [productId, idx, spec.label, spec.value]
        );
      }
    }

    await client.query(
      `INSERT INTO nari_catalog.branches (
        id, code, name, address, city, district, phone, supports_nowfree_2h, supports_clinic, is_active
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
      ON CONFLICT (code) DO NOTHING`,
      [
        dataset.branch.id,
        dataset.branch.code,
        dataset.branch.name,
        dataset.branch.address,
        dataset.branch.city,
        dataset.branch.district,
        dataset.branch.phone,
        dataset.branch.supportsNowfree2h,
        dataset.branch.supportsClinic,
      ]
    );
    const branchRes = await client.query('SELECT id FROM nari_catalog.branches WHERE code = $1', [dataset.branch.code]);
    const branchId = String(branchRes.rows[0].id);

    for (const p of seededProducts) {
      const invInsert = await client.query(
        `INSERT INTO nari_catalog.inventory_balances (branch_id, product_id, total_stock, reserved_stock, reorder_point)
        VALUES ($1, $2, 50, 0, 10)
        ON CONFLICT (branch_id, product_id) DO NOTHING
        RETURNING product_id`,
        [branchId, p.id]
      );
      if (invInsert.rows.length === 1) {
        await client.query(
          `INSERT INTO nari_catalog.inventory_movements (
            id, branch_id, product_id, delta, previous_stock, new_stock, reason, actor_id, idempotency_key
          ) VALUES ($1, $2, $3, 50, 0, 50, 'starter-catalog-seed', 'system:seed-starter-catalog', $4)
          ON CONFLICT (idempotency_key) DO NOTHING`,
          [`mov-seed-${branchId}-${p.id}`, branchId, p.id, `seed-starter:${branchId}:${p.id}`]
        );
      }
    }

    await client.query('COMMIT');
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'apply',
          branchId,
          products: seededProducts,
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error('SEED_FAILED:', error instanceof Error ? error.message : 'UNKNOWN_ERROR');
  process.exit(1);
});

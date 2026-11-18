/* eslint-disable @typescript-eslint/no-require-imports -- isolated TS storefront harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname,'..',file);
  const mod = { exports:{} };
  const localRequire = require('node:module').createRequire(filename);
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true } }).outputText;
  new Function('module','exports','require',code)(mod,mod.exports,id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(stubs,id)) return stubs[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`,stubs);
    return localRequire(id);
  });
  return mod.exports;
}

const product = { id:'p',sku:'REAL_SKU',slug:'merchant-product.html',name:'Merchant product',englishName:'Actual English',brand:'Merchant Brand',brandId:'b',categoryId:'child',category:'merchant-child.html',price:0,old:100,sale:100,image:'/real.png',images:['/real.png'],specs:[],updatedAt:'',catalogSource:'postgres' };
const catalog = { source:'postgres',products:{ [product.slug]:product },deletedSlugs:[],updatedAt:'',banners:{ heroSlides:[],sideBanners:[] },references:{ brands:[{ id:'b',slug:'merchant-brand',label:'Merchant Brand' },{ id:'empty-brand',slug:'empty-brand',label:'Empty Brand' }],categories:[{ id:'parent',slug:'merchant-parent.html',label:'Merchant Parent' },{ id:'child',slug:'merchant-child.html',label:'Merchant Child',parentId:'parent' },{ id:'empty-category',slug:'empty-category',label:'Empty Category' }] } };
const renderStubs = {
  'next/link':{ __esModule:true,default:({ children,...props }) => React.createElement('a',props,children) },
  'next/image':{ __esModule:true,default:() => null },
  '@/components/sites/hasaki/header':{ Header:() => null },
  '@/components/sites/hasaki/footer':{ Footer:() => null },
  '@/components/sites/hasaki/product-rich-sections':{ ProductRichSections:() => null },
};

test('current category hierarchy uses merchant IDs/slugs with no snapshot equivalence', () => {
  const { categoryProducts } = load('src/lib/catalog.ts');
  assert.deepEqual(categoryProducts('merchant-parent.html',catalog).map(p => p.sku),['REAL_SKU']);
  assert.deepEqual(categoryProducts('merchant-child.html',catalog).map(p => p.sku),['REAL_SKU']);
  for (const slug of ['unknown','empty-category','cham-soc-da-mat-c4.html']) assert.deepEqual(categoryProducts(slug,catalog),[]);
});

test('new and empty merchant brand/category routes render; unknown static/guessed slugs return404', async () => {
  const stubs = { ...renderStubs,
    'next/navigation':{ notFound:() => { throw Error('404'); } },
    '@/lib/server/live-catalog-store':{ readStorefrontCatalog:async () => catalog },
    '@/components/sites/hasaki/catalog-view':{ CategoryView:() => null,ProductView:() => null },
    '@/components/sites/hasaki/brand-products':{ BrandProducts:() => null },
    '@/components/sites/hasaki/new-product-view':{ NewProductView:() => null },
  };
  const CategoryPage = load('src/app/danh-muc/[slug]/page.tsx',stubs).default;
  for (const slug of ['merchant-parent.html','empty-category']) assert.equal((await CategoryPage({ params:Promise.resolve({ slug }) })).props.slug,slug);
  for (const slug of ['unknown','cham-soc-da-mat-c4.html']) await assert.rejects(() => CategoryPage({ params:Promise.resolve({ slug }) }),/404/);
  const BrandPage = load('src/app/thuong-hieu/[slug]/page.tsx',stubs).default;
  for (const slug of ['merchant-brand','empty-brand']) {
    const html = renderToStaticMarkup(await BrandPage({ params:Promise.resolve({ slug }),searchParams:Promise.resolve({}) }));
    assert.match(html,new RegExp(slug === 'merchant-brand' ? 'Merchant Brand' : 'Empty Brand'));
  }
  for (const slug of ['unknown','bioderma.html']) await assert.rejects(() => BrandPage({ params:Promise.resolve({ slug }),searchParams:Promise.resolve({}) }),/404/);
  const ProductPage = load('src/app/san-pham/[slug]/page.tsx',stubs).default;
  assert.equal((await ProductPage({ params:Promise.resolve({ slug:product.slug }) })).props.brandHref,'/thuong-hieu/merchant-brand');
  const BrandsPage = load('src/app/thuong-hieu/page.tsx',stubs).default;
  const html = renderToStaticMarkup(await BrandsPage());
  assert.match(html,/href="\/thuong-hieu\/merchant-brand"/);
  assert.match(html,/href="\/thuong-hieu\/empty-brand"/);
  assert.doesNotMatch(html,/href="\/thuong-hieu\/bioderma.html"/);
});

test('merchant brand card and product detail render managed English without synthetic claims', () => {
  const { ProductCard } = load('src/components/sites/hasaki/product-card.tsx',renderStubs);
  const { BrandProducts } = load('src/components/sites/hasaki/brand-products.tsx',{ ...renderStubs,'@/components/sites/hasaki/product-card':{ ProductCard } });
  const html = renderToStaticMarkup(React.createElement(BrandProducts,{ name:'Merchant Brand',items:[product],deals:false,source:'postgres',categoryOptions:[['Merchant Child','merchant-child.html']] }));
  assert.match(html,/Actual English/);
  assert.match(html,/Merchant Child/);
  assert.doesNotMatch(html,/sản phẩm mẫu|tháng 11\/2026|Bill /);
  const deals = renderToStaticMarkup(React.createElement(BrandProducts,{ name:'Merchant Brand',items:[product],deals:true,source:'postgres' }));
  assert.doesNotMatch(deals,/href="\/san-pham\/merchant-product.html"/);
  const { ProductView } = load('src/components/sites/hasaki/catalog-view.tsx',{ ...renderStubs,'@/components/sites/hasaki/product-card':{ ProductCard } });
  const detail = renderToStaticMarkup(React.createElement(ProductView,{ slug:product.slug,liveCatalog:catalog,brandHref:'/thuong-hieu/merchant-brand' }));
  assert.match(detail,/Actual English/);
  assert.match(detail,/REAL_SKU/);
  assert.match(detail,/Chưa có đánh giá/);
  assert.match(detail,/Chưa có dữ liệu tồn kho/);
  assert.doesNotMatch(detail,/228 đánh giá|100220035|186 CH|4[.]9 \(/);
});

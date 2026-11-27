/* eslint-disable @typescript-eslint/no-require-imports -- isolated server TS harness */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');

function load(file, stubs = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const mod = { exports: {} };
  const localRequire = require('node:module').createRequire(filename);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022, jsx:ts.JsxEmit.ReactJSX, esModuleInterop:true } }).outputText;
  new Function('module','exports','require',code)(mod,mod.exports,id => {
    if (id === 'server-only') return {};
    if (Object.hasOwn(stubs,id)) return stubs[id];
    if (id.startsWith('@/')) return load(`src/${id.slice(2)}.ts`,stubs);
    return localRequire(id);
  });
  return mod.exports;
}

test('verified admin reaches all workspaces; each provisioned staff role reaches only its own', async () => {
  const { resolveStaffPortalAccess } = load('src/lib/server/staff-portal-access.ts');
  const { STAFF_WORKSPACES, canViewStaffWorkspace } = load('src/lib/staff-workspaces.ts');
  const auth = { getUser:async () => ({ data:{ user:{ id:'verified', user_metadata:{ role:'admin' } } }, error:null }) };
  for (const role of ['admin','store_manager','warehouse_staff','cs_agent','customer']) {
    const access = await resolveStaffPortalAccess(auth,{ findActiveIdentity:async () => ({ userId:'verified', role, active:true, fullName:'Provisioned', branchId:role === 'admin' ? null : 'branch' }) });
    assert.equal(access.status,role === 'customer' ? 403 : 200);
    if (access.status === 200) for (const workspace of STAFF_WORKSPACES) assert.equal(canViewStaffWorkspace(access.user.role,workspace), role === 'admin' || role === workspace.role);
  }
  for (const identity of [null,{ userId:'verified',role:'admin',active:false,fullName:'Inactive',branchId:null },{ userId:'verified',role:'warehouse_staff',active:true,fullName:'No branch',branchId:null }]) assert.equal((await resolveStaffPortalAccess(auth,{ findActiveIdentity:async () => identity })).status,401);
  assert.equal((await resolveStaffPortalAccess({ getUser:async () => ({ data:{ user:null },error:null }) },{ findActiveIdentity:() => { throw Error('must not query'); } })).status,401);
});

test('staff portal config requires explicit flag and retains the production auth restriction', () => {
  const original = { ...process.env };
  const { readStaffPortalConfig } = load('src/lib/server/staff-portal-access.ts');
  try {
    Object.assign(process.env,{ NODE_ENV:'test',NARI_AUTH_ENABLED:'true',NEXT_PUBLIC_SUPABASE_URL:'https://project.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_abcdefghijklmnop',APP_ORIGIN:'http://localhost:3036',NARI_POSTGRES_URL:'postgresql://runtime:private@db.test/catalog' });
    delete process.env.NARI_STAFF_PORTAL_ENABLED;
    assert.throws(() => readStaffPortalConfig(),/STAFF_PORTAL_DISABLED/);
    process.env.NARI_STAFF_PORTAL_ENABLED='true';
    assert.equal(readStaffPortalConfig().origin,'http://localhost:3036');
    process.env.NODE_ENV='production';
    assert.throws(() => readStaffPortalConfig(),/disabled/);
  } finally { process.env = original; }
});

test('server workspace pages reject unknown/cross-role/customer/guest and render authorized identities', async () => {
  let calls = 0;
  let access = { status:200,user:{ id:'admin',role:'admin',fullName:'Verified admin' } };
  const stubs = {
    'next/headers':{ headers:async () => new Headers() },
    'next/navigation':{ notFound:() => { throw Error('404'); },redirect:url => { throw Error(`REDIRECT:${url}`); } },
    '@/lib/server/staff-portal-access':{ authorizeStaffPortalPage:async () => { calls++; return access; } },
    '@/components/sites/nari/staff-workspace-view':{ StaffWorkspaceView:() => null },
  };
  const page = load('src/app/nhan-vien/[workspace]/page.tsx',stubs).default;
  await assert.rejects(() => page({ params:Promise.resolve({ workspace:'unknown' }) }),/404/);
  await assert.rejects(() => page({ params:Promise.resolve({ workspace:'clinic' }) }),/404/);
  assert.equal(calls,0);
  for (const workspace of ['cua-hang','kho','cskh']) assert.equal((await page({ params:Promise.resolve({ workspace }) })).props.session.id,'admin');
  access = { status:200,user:{ role:'warehouse_staff',branchId:'branch' } };
  assert.equal((await page({ params:Promise.resolve({ workspace:'kho' }) })).props.session.role,'warehouse_staff');
  await assert.rejects(() => page({ params:Promise.resolve({ workspace:'cua-hang' }) }),/404/);
  access = { status:403,user:null };
  await assert.rejects(() => load('src/app/nhan-vien/page.tsx',stubs).default(),/404/);
  access = { status:401,user:null };
  await assert.rejects(() => page({ params:Promise.resolve({ workspace:'kho' }) }),/REDIRECT:\/dang-nhap/);
  access = { status:503,user:null };
  assert.ok(await page({ params:Promise.resolve({ workspace:'kho' }) }));
});

test('staff proxy preserves refreshed request/response cookies and keeps ERP on legacy closed gate', async () => {
  const { proxy,config } = load('src/proxy.ts',{
    '@/lib/server/supabase-session':{ createSupabaseSession:request => ({ response:(() => { const response = NextResponse.json({}); response.cookies.set('sb-token','fresh',{ httpOnly:true }); return response; })(), client:{ auth:{ getUser:async () => { request.cookies.set('sb-token','fresh'); return {}; } } } }) },
  });
  assert.ok(config.matcher.includes('/nhan-vien/:path*'));
  const request = new NextRequest('http://localhost:3036/nhan-vien/kho');
  const response = await proxy(request);
  assert.equal(request.cookies.get('sb-token').value,'fresh');
  assert.equal(response.cookies.get('sb-token').value,'fresh');
  assert.equal(response.cookies.get('sb-token').httpOnly,true);
  assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.equal((await proxy(new NextRequest('http://localhost:3036/quan-tri'))).status,307);
});

test('session capabilities reflect server-provisioned roles and never enable business APIs', async () => {
  let role = 'warehouse_staff';
  const identities = { findActiveIdentity:async () => ({ userId:'verified',role,active:true,fullName:'Staff',branchId:'branch' }) };
  const auth = { getUser:async () => ({ data:{ user:{ id:'verified',email:'staff@test.invalid',user_metadata:{ role:'admin' } } },error:null }) };
  const { resolveStaffPortalAccess } = load('src/lib/server/staff-portal-access.ts');
  const route = load('src/app/api/session/route.ts',{
    '@/lib/server/supabase-session':{ createSupabaseSession:() => ({ response:NextResponse.json({}),client:{ auth } }), sessionResponse:(_template,body,status=200) => NextResponse.json(body,{ status }) },
    '@/lib/server/catalog-admin-access':{ readCatalogAdminConfig:() => { throw Error('disabled'); } },
    '@/lib/server/staff-portal-access':{ readStaffPortalConfig:() => ({}),resolveStaffPortalAccess },
    '@/lib/server/postgres-database':{ getPostgresDatabase:() => ({}) },
    '@/lib/server/supabase-principal':{ createIdentityRoleRepository:() => identities },
  });
  const response = await route.GET(new NextRequest('http://localhost:3036/api/session'));
  const body = await response.json();
  assert.equal(body.staffPortalAccess,true);
  assert.equal(body.catalogAccess,false);
  assert.equal(body.businessAccess,false);
  assert.equal(body.user.role,undefined);
  role = 'customer';
  assert.equal((await (await route.GET(new NextRequest('http://localhost:3036/api/session'))).json()).staffPortalAccess,false);
});

test('staff workspaces render disabled tasks without fixture business data', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { STAFF_WORKSPACES } = load('src/lib/staff-workspaces.ts');
  const { StaffWorkspaceView } = load('src/components/sites/nari/staff-workspace-view.tsx',{
    'next/link':{ __esModule:true,default:({ children,...props }) => React.createElement('a',props,children) },
  });
  const html = renderToStaticMarkup(React.createElement(StaffWorkspaceView,{ session:{ role:'admin',fullName:'Verified',roleLabel:'Admin' },workspace:STAFF_WORKSPACES[0] }));
  assert.equal((html.match(/<button disabled=""/g) || []).length,3);
  assert.match(html,/Chưa có dữ liệu nghiệp vụ/);
  for (const workspace of STAFF_WORKSPACES) assert.ok(html.includes(`/nhan-vien/${workspace.slug}`));
  assert.doesNotMatch(html,/href="\/quan-tri"/);
});

test('storefront capability navigation ignores role claims and logs out through provider endpoint', async () => {
  const originalFetch = globalThis.fetch;
  const { fetchSessionCapabilities,logoutProviderSession } = load('src/lib/session-capabilities.ts');
  try {
    globalThis.fetch = async () => Response.json({ ok:true,user:{ id:'verified',role:'admin' },businessAccess:false });
    assert.deepEqual(await fetchSessionCapabilities(),{ authenticated:true,catalogAccess:false,staffPortalAccess:false });
    globalThis.fetch = async () => Response.json({ ok:true,user:{ id:'verified' },catalogAccess:true,staffPortalAccess:true });
    const capabilities = await fetchSessionCapabilities();
    assert.equal(capabilities.catalogAccess,true);
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const { AccountDialog } = load('src/components/sites/nari/account-dialog.tsx',{
      'next/link':{ __esModule:true,default:({ children,...props }) => React.createElement('a',props,children) },
    });
    const adminHtml = renderToStaticMarkup(React.createElement(AccountDialog,{ capabilities,onClose:() => {},onLoggedOut:() => {} }));
    assert.match(adminHtml,/href="\/quan-tri"/);
    assert.match(adminHtml,/href="\/quan-tri\/san-pham"/);
    assert.match(adminHtml,/href="\/nhan-vien"/);
    assert.match(adminHtml,/href="\/khach-hang\/tai-khoan"/);
    const customerHtml = renderToStaticMarkup(React.createElement(AccountDialog,{
      capabilities:{ authenticated:true,catalogAccess:false,staffPortalAccess:false },
      onClose:() => {},
      onLoggedOut:() => {},
    }));
    assert.match(customerHtml,/href="\/khach-hang\/tai-khoan"/);
    assert.doesNotMatch(customerHtml,/href="\/quan-tri"|href="\/quan-tri\/san-pham"|href="\/nhan-vien"/);
    const guestHtml = renderToStaticMarkup(React.createElement(AccountDialog,{
      capabilities:{ authenticated:false,catalogAccess:false,staffPortalAccess:false },
      onClose:() => {},
      onLoggedOut:() => {},
    }));
    assert.match(guestHtml,/href="\/dang-nhap"/);
    assert.match(guestHtml,/href="\/dang-ky"/);
    assert.match(guestHtml,/href="\/khoi-phuc-mat-khau"/);
    assert.doesNotMatch(guestHtml,/href="\/quan-tri"|href="\/quan-tri\/san-pham"|href="\/nhan-vien"|href="\/khach-hang/);
    globalThis.fetch = async (url,init) => { assert.equal(url,'/api/session'); assert.equal(init.method,'POST'); assert.deepEqual(JSON.parse(init.body),{ action:'logout' }); return Response.json({ ok:true,businessAccess:false }); };
    await logoutProviderSession();
    globalThis.fetch = async () => Response.json({ ok:false },{ status:401 });
    assert.deepEqual(await fetchSessionCapabilities(),{ authenticated:false,catalogAccess:false,staffPortalAccess:false });
    await assert.rejects(() => logoutProviderSession(),/Chưa thể đăng xuất/);
  } finally { globalThis.fetch = originalFetch; }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { authenticationRequired, serviceUnavailable } from "../src/lib/server/access-policy.ts";

test("unfinished order endpoints reject requests before accessing data", async () => {
  const source = readFileSync(new URL("../src/app/api/orders/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const dependencies = {
    "next/server": { NextResponse: Response },
    "@/lib/server/access-policy": { authenticationRequired, serviceUnavailable },
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", outputText)((name) => {
    if (!Object.hasOwn(dependencies, name)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  }, module, module.exports);
  const request = new Request("http://localhost/api/orders?code=example", { method: "GET" });
  assert.equal((await module.exports.GET(request)).status, 401);
  const post = new Request("http://localhost/api/orders", { method: "POST" });
  post.json = () => { throw new Error("Unexpected body access"); };
  assert.equal((await module.exports.POST(post)).status, 503);
});

test("unverified payment webhook cannot change order state", async () => {
  const source = readFileSync(new URL("../src/app/api/payments/webhook/route.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const dependencies = {
    "next/server": { NextResponse: Response },
    "@/lib/server/access-policy": { serviceUnavailable },
  };
  new Function("require", "module", "exports", outputText)((name) => {
    if (!Object.hasOwn(dependencies, name)) throw new Error(`Unexpected import ${name}`);
    return dependencies[name];
  }, module, module.exports);
  const request = new Request("http://localhost/api/payments/webhook", { method: "POST" });
  request.json = () => { throw new Error("Unexpected body access"); };
  assert.equal((await module.exports.POST(request)).status, 503);
});

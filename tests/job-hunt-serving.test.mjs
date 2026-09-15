import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function srcFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "generated" || entry === "node_modules") continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...srcFiles(full));
    else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

test("serving.ts performs zero external API calls", () => {
  const src = read("src/lib/jobs/serving.ts");
  const markers = ["jsearch", "JSearchProvider", "searchJobs", "JobSearchProvider", "rapidapi"];
  for (const m of markers) {
    assert.ok(!src.toLowerCase().includes(m.toLowerCase()), `serving.ts must not reference "${m}"`);
  }
  assert.ok(!/fetch\s*\(/.test(src), "serving.ts must not call fetch");
});

test("recommend route performs zero external API calls", () => {
  const src = read("src/app/api/jobs/recommend/route.ts");
  const markers = ["JSearchProvider", "searchJobs", "rapidapi"];
  for (const m of markers) {
    assert.ok(!src.toLowerCase().includes(m.toLowerCase()), `recommend route must not reference "${m}"`);
  }
  assert.ok(!/fetch\s*\(/.test(src), "recommend route must not call fetch directly");
});

test("only the ingestion module touches the JSearch provider", () => {
  const allowed = new Set([
    join(ROOT, "src/lib/jobs/ingest.ts").replace(/\\/g, "/"),
    join(ROOT, "src/lib/jobs/jsearch.ts").replace(/\\/g, "/"),
    join(ROOT, "src/lib/jobs/provider.ts").replace(/\\/g, "/"),
  ]);
  for (const f of srcFiles(join(ROOT, "src"))) {
    const norm = f.replace(/\\/g, "/");
    if (allowed.has(norm)) continue;
    const src = readFileSync(f, "utf8");
    if (
      src.includes("JSearchProvider") ||
      src.includes('from "@/lib/jobs/jsearch"') ||
      src.includes('from "./jsearch"')
    ) {
      assert.fail(`${norm} must not import the JSearch provider (serving/ingestion boundary violated)`);
    }
  }
});

test("serving.ts reads the shared pool and ranks locally", () => {
  const src = read("src/lib/jobs/serving.ts");
  assert.ok(src.includes("readPool"), "serving must read from the shared JobPool");
  assert.ok(src.includes("rankJobs"), "serving must use the local six-dimension ranker");
});

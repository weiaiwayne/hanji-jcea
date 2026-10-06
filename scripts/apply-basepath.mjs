/**
 * Codemod: route every hard-coded internal URL (fetch/href/src/action pointing
 * at /api/... and client-side window.location assignments) through the api()
 * helper from src/lib/basePath.ts so the app works under a basePath.
 * Idempotent — running twice makes no further changes.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] || "src");
let changedFiles = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) processFile(p);
  }
}

function processFile(file) {
  let src = fs.readFileSync(file, "utf8");
  const orig = src;

  // fetch("/api/...", …) and fetch(`/api/...`, …)
  src = src.replace(/fetch\("(\/api\/[^"]*)"/g, 'fetch(api("$1")');
  src = src.replace(/fetch\(`(\/api\/[^`]*)`/g, "fetch(api(`$1`)");

  // JSX attributes: href/src/action with /api/ URLs
  src = src.replace(/(href|src|action)="(\/api\/[^"]*)"/g, '$1={api("$2")}');
  src = src.replace(/(href|src|action)=\{`(\/api\/[^`]*)`\}/g, "$1={api(`$2`)}");

  // Client-side page navigations
  src = src.replace(/window\.location\.href = "(\/[^"]*)"/g, 'window.location.href = api("$1")');
  src = src.replace(/window\.location\.href = `(\/[^`]*)`/g, "window.location.href = api(`$1`)");
  src = src.replace(
    /window\.location\.href = (data\.redirect [|]{2} "(\/[^"]*)")/g,
    'window.location.href = api($1)'
  );

  if (src !== orig && !src.includes('from "@/lib/basePath"')) {
    // Insert the import after the last existing import (or "use client" directive)
    const lines = src.split("\n");
    let insertAt = 0;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*(import\s|"use client"|'use client')/.test(lines[i])) insertAt = i + 1;
      else if (lines[i].trim() === "" && insertAt === i) insertAt = i + 1;
    }
    lines.splice(insertAt, 0, 'import { api } from "@/lib/basePath";');
    src = lines.join("\n");
  }

  if (src !== orig) {
    fs.writeFileSync(file, src);
    changedFiles++;
    console.log("updated", path.relative(process.cwd(), file));
  }
}

walk(ROOT);
console.log(`done: ${changedFiles} files updated`);

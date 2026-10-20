#!/usr/bin/env node
import { ensureApiKey, resolveYoudaonoteBin, runYoudao } from "./lib.mjs";

console.log("youdaonote:", resolveYoudaonoteBin());
const key = ensureApiKey();
if (!key.ok) {
  console.error("❌", key.reason);
  process.exit(1);
}
const check = runYoudao(["check"]);
console.log(check.out || check.err);
process.exit(check.ok ? 0 : 1);

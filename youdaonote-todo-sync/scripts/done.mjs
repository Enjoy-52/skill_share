#!/usr/bin/env node
/**
 * 将有道待办标为已完成
 * 用法: node done.mjs <id> [id2...] [--root <项目路径>]
 */
import fs from "fs";
import {
  ensureApiKey,
  findProjectRoot,
  getSyncPaths,
  runYoudao,
} from "./lib.mjs";

const args = process.argv.slice(2);
let projectRoot = null;
const ids = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--root" && args[i + 1]) projectRoot = args[++i];
  else if (!args[i].startsWith("--")) ids.push(args[i]);
}

if (ids.length === 0) {
  console.error("用法: node done.mjs <local-id> [id2...]");
  process.exit(1);
}

projectRoot = projectRoot || findProjectRoot();
if (!projectRoot) {
  console.error("❌ 未找到 .youdao-sync");
  process.exit(1);
}

const keyCheck = ensureApiKey();
if (!keyCheck.ok) {
  console.error("❌", keyCheck.reason);
  process.exit(1);
}

const { map, syncDir } = getSyncPaths(projectRoot);
const mapData = JSON.parse(fs.readFileSync(map, "utf8"));
const items = mapData.items || {};

for (const id of ids) {
  const entry = items[id];
  if (!entry?.youdaoId) {
    console.error("!", id, "无 youdaoId，请先 push");
    continue;
  }
  const r = runYoudao(["todo", "update", entry.youdaoId, "--done"]);
  if (r.ok) {
    entry.status = "done";
    entry.doneAt = new Date().toISOString();
    console.log("✓", id, "→ 已完成");
  } else {
    console.error("!", id, r.err);
  }
}

fs.writeFileSync(map, JSON.stringify(mapData, null, 2) + "\n");
const logFile = `${syncDir}/sync-session-${new Date().toISOString().slice(0, 10)}.log`;
fs.appendFileSync(
  logFile,
  `\n--- ${new Date().toISOString()} done ---\nids: ${ids.join(" ")}\n`,
);

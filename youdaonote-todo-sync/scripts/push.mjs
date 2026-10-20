#!/usr/bin/env node
/**
 * 推送 .youdao-sync/pending-todos.json 到有道云笔记待办
 * 用法: node push.mjs [--root <项目路径>] [--group <分组名>]
 */
import fs from "fs";
import {
  ensureApiKey,
  findProjectRoot,
  getSyncPaths,
  initSyncDir,
  resolveGroupId,
  resolveYoudaonoteBin,
  runYoudao,
} from "./lib.mjs";

const args = process.argv.slice(2);
let projectRoot = null;
let groupName = process.env.YOUDAO_TODO_GROUP || "MT-EnjoyAIAppTop";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--root" && args[i + 1]) projectRoot = args[++i];
  else if (args[i] === "--group" && args[i + 1]) groupName = args[++i];
  else if (args[i] === "init") {
    const root = findProjectRoot() || process.cwd();
    const p = initSyncDir(root, groupName);
    console.log("✓ 已初始化", p.syncDir);
    process.exit(0);
  }
}

projectRoot = projectRoot || findProjectRoot();
if (!projectRoot) {
  console.error("❌ 未找到 .youdao-sync。请在项目根执行: node push.mjs init");
  process.exit(1);
}

const keyCheck = ensureApiKey();
if (!keyCheck.ok) {
  console.error("❌", keyCheck.reason);
  process.exit(1);
}

const { pending, map } = getSyncPaths(projectRoot);
if (!fs.existsSync(pending)) {
  initSyncDir(projectRoot, groupName);
}

const groupId = resolveGroupId(groupName);
if (!groupId) {
  console.error("❌ 无法解析/创建分组:", groupName);
  process.exit(1);
}
console.log("✓ 分组:", groupName, groupId);

const mapData = JSON.parse(fs.readFileSync(map, "utf8"));
const pendingData = JSON.parse(fs.readFileSync(pending, "utf8"));
mapData.groupId = groupId;
mapData.groupName = groupName;
const items = mapData.items || {};
const todos = pendingData.todos || [];
const bin = resolveYoudaonoteBin();
let created = 0;
let skipped = 0;

for (const t of todos) {
  if (items[t.id]?.youdaoId) {
    skipped++;
    continue;
  }
  const r = runYoudao([
    "todo",
    "create",
    "-t",
    t.title || t.id,
    "-c",
    t.content || "",
    "-g",
    groupId,
  ]);
  if (r.ok) {
    console.log("  +", t.id);
    created++;
  } else {
    console.error("  !", t.id, r.err);
  }
}

if (created > 0) {
  const list = runYoudao(["todo", "list", "-g", groupId, "--json"]);
  if (list.ok) {
    try {
      const arr = JSON.parse(list.out);
      for (const t of todos) {
        if (items[t.id]?.youdaoId) continue;
        const hit = arr.find((x) => x.title === t.title);
        if (hit?.id) {
          items[t.id] = {
            youdaoId: hit.id,
            title: t.title,
            syncedAt: new Date().toISOString(),
            status: hit.finished ? "done" : "open",
          };
          console.log("  ↔", t.id);
        }
      }
    } catch {
      console.warn("  ! list 回填失败，请核对 map.json");
    }
  }
}

mapData.items = items;
pendingData.syncedAt = new Date().toISOString();
fs.writeFileSync(map, JSON.stringify(mapData, null, 2) + "\n");
fs.writeFileSync(pending, JSON.stringify(pendingData, null, 2) + "\n");
console.log(`\n完成: 新建 ${created}，跳过 ${skipped}`);
console.log("CLI:", bin);

#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { expandPath, findProjectRoot, parseEnvText, SKILL_ROOT } from "./lib.mjs";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const root = arg("--root") || findProjectRoot() || process.cwd();
const out = expandPath(
  arg("--out") ||
    (root ? join(root, "config", "local", "dev-ssh.env") : join(SKILL_ROOT, "ecs.env")),
);

const host = arg("--host");
const user = arg("--user") || "root";
const port = arg("--port") || "22";
const key = arg("--key");
const title = arg("--title") || "阿里云 ECS";
const force = process.argv.includes("--force");

if (existsSync(out) && !force) {
  console.error(`目标已存在: ${out}`);
  console.error("使用 --force 覆盖，或 --out 指定其他路径");
  process.exit(1);
}

const example = join(SKILL_ROOT, "ecs.env.example");
const text = existsSync(example)
  ? readFileSync(example, "utf8")
  : "ECS_HOST=\nECS_USER=root\nECS_PORT=22\nECS_KEY=\n";

const vars = parseEnvText(text);
if (host) vars.ECS_HOST = host;
if (user) vars.ECS_USER = user;
if (port) vars.ECS_PORT = port;
if (key) vars.ECS_KEY = expandPath(key);
if (title) vars.ECS_TITLE = title;

const lines = [
  "# 由 deplop-aliyun-ecs/scripts/init.mjs 生成，勿提交 git",
  `# 生成时间: ${new Date().toISOString()}`,
  "",
  `ECS_HOST=${vars.ECS_HOST || ""}`,
  `ECS_USER=${vars.ECS_USER || "root"}`,
  `ECS_PORT=${vars.ECS_PORT || "22"}`,
  `ECS_KEY=${vars.ECS_KEY || ""}`,
  `ECS_TITLE=${vars.ECS_TITLE || "阿里云 ECS"}`,
  "",
];

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n"), "utf8");
console.log("已写入:", out);
if (!vars.ECS_HOST || !vars.ECS_KEY) {
  console.log("请补全 ECS_HOST 与 ECS_KEY 后执行 check-config.mjs");
}

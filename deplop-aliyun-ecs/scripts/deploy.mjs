#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  buildDeployEnv,
  DEPLOY_KEYS,
  findProjectRoot,
  SSH_KEYS,
  toShellExports,
  usageHint,
  validateSshConfig,
} from "./lib.mjs";

const MODES = new Set(["all", "services", "admin", "qms", "nginx"]);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const envFile = (() => {
  const i = args.indexOf("--env");
  if (i >= 0 && args[i + 1]) return args[i + 1];
  const j = args.indexOf("-e");
  if (j >= 0 && args[j + 1]) return args[j + 1];
  return null;
})();
const rootArg = (() => {
  const i = args.indexOf("--root");
  if (i >= 0 && args[i + 1]) return args[i + 1];
  const j = args.indexOf("-r");
  if (j >= 0 && args[j + 1]) return args[j + 1];
  return null;
})();

const mode = args.find((a) => MODES.has(a)) || "all";
const root = rootArg || findProjectRoot();
if (!root) {
  console.error("找不到 deploy/deploy-ecs.sh，请 --root 指定项目目录");
  process.exit(1);
}

const script = join(root, "deploy", "deploy-ecs.sh");
if (!existsSync(script)) {
  console.error("缺少部署脚本:", script);
  process.exit(1);
}

const { vars, loaded } = buildDeployEnv(root, envFile);
const { errors } = validateSshConfig(vars);
if (errors.length) {
  console.error("配置无效:");
  for (const e of errors) console.error(" ", e);
  console.error("\n先运行: node", join("~/.cursor/skills/deplop-aliyun-ecs/scripts/check-config.mjs"));
  process.exit(1);
}

const exportKeys = [...new Set([...SSH_KEYS, ...DEPLOY_KEYS])];
const shellPrefix = toShellExports(vars, exportKeys);

console.log("项目:", root);
console.log("模式:", mode);
console.log("配置:", loaded.join(" → ") || "(默认)");

const cmd = `cd ${JSON.stringify(root)} && ${shellPrefix} bash deploy/deploy-ecs.sh ${mode}`;
if (dryRun) {
  console.log("\n[dry-run]", cmd);
  process.exit(0);
}

const res = spawnSync("bash", ["-lc", cmd], {
  stdio: "inherit",
  env: { ...process.env, ...vars },
});
process.exit(res.status ?? 1);

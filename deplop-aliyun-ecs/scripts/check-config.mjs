#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  buildDeployEnv,
  expandPath,
  findProjectRoot,
  usageHint,
  validateSshConfig,
} from "./lib.mjs";

function arg(name, short) {
  const i = process.argv.indexOf(name);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  const j = short ? process.argv.indexOf(short) : -1;
  if (j >= 0 && process.argv[j + 1]) return process.argv[j + 1];
  return null;
}

const root =
  arg("--root", "-r") ||
  findProjectRoot() ||
  process.cwd();
const envFile = arg("--env", "-e");

const { vars, loaded } = buildDeployEnv(root, envFile);
const { errors, warnings, keyPath } = validateSshConfig(vars);

console.log("项目根:", root);
console.log("已加载配置:");
if (loaded.length === 0) {
  console.log("  (无)");
} else {
  for (const p of loaded) console.log("  -", p);
}

if (warnings.length) {
  console.log("\n警告:");
  for (const w of warnings) console.log("  ⚠", w);
}

if (errors.length) {
  console.error("\n错误:");
  for (const e of errors) console.error("  ❌", e);
  console.error("\n" + usageHint());
  process.exit(1);
}

console.log("\nSSH 目标:", `${vars.ECS_USER || "root"}@${vars.ECS_HOST}:${vars.ECS_PORT || 22}`);
console.log("私钥:", keyPath);
if (vars.DEPLOY_REMOTE_DIR) console.log("远程目录:", vars.DEPLOY_REMOTE_DIR);
if (vars.DEPLOY_SITE_DOMAIN) console.log("站点域名:", vars.DEPLOY_SITE_DOMAIN);

if (process.argv.includes("--ssh-test")) {
  const ssh = spawnSync(
    "ssh",
    [
      "-i",
      keyPath,
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=8",
      "-o",
      "StrictHostKeyChecking=accept-new",
      "-p",
      String(vars.ECS_PORT || 22),
      `${vars.ECS_USER || "root"}@${vars.ECS_HOST}`,
      "echo ok",
    ],
    { encoding: "utf8" },
  );
  if (ssh.status === 0) {
    console.log("\nSSH 连通: ok");
  } else {
    console.error("\nSSH 连通失败:", (ssh.stderr || ssh.stdout || "").trim());
    process.exit(ssh.status || 1);
  }
}

console.log("\n✅ 配置检查通过");

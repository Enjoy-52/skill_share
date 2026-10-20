#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const SKILL_ROOT = resolve(__dirname, "..");
export const GLOBAL_ECS_ENV = join(SKILL_ROOT, "ecs.env");

export const SSH_KEYS = ["ECS_HOST", "ECS_USER", "ECS_PORT", "ECS_KEY", "ECS_SSH_ENV"];
export const DEPLOY_KEYS = [
  "DEPLOY_REMOTE_DIR",
  "DEPLOY_WEB_PORT",
  "DEPLOY_ADMIN_PORT",
  "DEPLOY_QMS_PORT",
  "DEPLOY_PUBLIC_PORT",
  "DEPLOY_QMS_PUBLIC_PORT",
  "DEPLOY_SITE_DOMAIN",
  "ADMIN_TOKEN",
  "AUTH_SECRET",
  "DATABASE_URL",
  "SSL_CERT_DIR",
  "SSL_CERT_PEM",
  "SSL_CERT_KEY",
  "QMS_UPLOAD_DIR",
  "QMS_PUBLIC_URL",
  "NEXT_PUBLIC_QMS_PUBLIC_URL",
  "OCR_PROVIDER",
  "OCR_API_KEY",
  "OCR_API_SECRET",
  "OCR_BAIDU_ENDPOINT",
];

export function expandPath(p) {
  if (!p) return p;
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  if (p === "~") return homedir();
  return p;
}

/** 解析 KEY=VALUE 行（跳过注释与空行） */
export function parseEnvText(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

export function loadEnvFile(path) {
  const abs = resolve(expandPath(path));
  if (!existsSync(abs)) return { path: abs, vars: {}, missing: true };
  return {
    path: abs,
    vars: parseEnvText(readFileSync(abs, "utf8")),
    missing: false,
  };
}

/** 自 cwd 向上查找含 deploy/deploy-ecs.sh 的仓库根 */
export function findProjectRoot(start = process.cwd()) {
  let dir = resolve(start);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, "deploy", "deploy-ecs.sh"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** 配置文件搜索顺序（后者覆盖前者） */
export function resolveConfigPaths(root, explicitEnv) {
  const paths = [];
  if (explicitEnv) paths.push(expandPath(explicitEnv));
  if (process.env.ECS_DEPLOY_ENV) paths.push(expandPath(process.env.ECS_DEPLOY_ENV));
  if (process.env.ECS_SSH_ENV) paths.push(expandPath(process.env.ECS_SSH_ENV));
  if (root) {
    paths.push(
      join(root, "config", "local", "dev-ssh.env"),
      join(root, "deploy", "config", "aliyun-ecs", "deploy-fudan-ilab.env"),
      join(root, "config", "local", "deploy-fudan-ilab.env"),
    );
  }
  paths.push(GLOBAL_ECS_ENV);
  return [...new Set(paths.map((p) => resolve(expandPath(p))))];
}

export function mergeConfig(paths) {
  const merged = {};
  const loaded = [];
  for (const p of paths) {
    const { vars, missing } = loadEnvFile(p);
    if (missing) continue;
    Object.assign(merged, vars);
    loaded.push(p);
  }
  return { vars: merged, loaded };
}

export function validateSshConfig(vars) {
  const errors = [];
  const warnings = [];
  if (!vars.ECS_HOST) errors.push("缺少 ECS_HOST");
  if (!vars.ECS_KEY) errors.push("缺少 ECS_KEY");
  const keyPath = expandPath(vars.ECS_KEY);
  if (vars.ECS_KEY && !existsSync(keyPath)) {
    errors.push(`SSH 私钥不存在: ${keyPath}`);
  } else if (vars.ECS_KEY) {
    try {
      readFileSync(keyPath);
    } catch {
      errors.push(`SSH 私钥不可读: ${keyPath}`);
    }
  }
  if (!vars.ECS_USER) warnings.push("未设置 ECS_USER，部署脚本默认 root");
  if (!vars.ECS_PORT) warnings.push("未设置 ECS_PORT，部署脚本默认 22");
  return { errors, warnings, keyPath };
}

export function toShellExports(vars, keys) {
  const lines = [];
  for (const k of keys) {
    if (vars[k] == null || vars[k] === "") continue;
    const v = String(vars[k]).replace(/'/g, `'\\''`);
    lines.push(`${k}='${v}'`);
  }
  return lines.join(" ");
}

export function buildDeployEnv(root, explicitEnv) {
  const paths = resolveConfigPaths(root, explicitEnv);
  const { vars, loaded } = mergeConfig(paths);

  // ECS_SSH_ENV：若合并结果未指定，用第一个含 ECS_HOST 的已加载文件
  if (!vars.ECS_SSH_ENV) {
    for (const p of loaded) {
      const { vars: v } = loadEnvFile(p);
      if (v.ECS_HOST) {
        vars.ECS_SSH_ENV = p;
        break;
      }
    }
  }

  return { vars, loaded, paths, root };
}

export function usageHint() {
  return `用法:
  node scripts/check-config.mjs [--root <项目>] [--env <配置文件>]
  node scripts/init.mjs --out <路径> [--host H] [--user U] [--port P] [--key K]
  node scripts/deploy.mjs [all|services|admin|qms|nginx] [--env <配置文件>] [--root <项目>] [--dry-run]`;
}

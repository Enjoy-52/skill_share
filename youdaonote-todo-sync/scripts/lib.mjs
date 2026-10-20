import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function skillPath(...parts) {
  return path.join(SKILL_ROOT, ...parts);
}

/** 向上查找含 .youdao-sync 的目录 */
export function findProjectRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, ".youdao-sync"))) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

export function getSyncPaths(projectRoot) {
  const syncDir = path.join(projectRoot, ".youdao-sync");
  return {
    syncDir,
    pending: path.join(syncDir, "pending-todos.json"),
    map: path.join(syncDir, "map.json"),
  };
}

function cliPathCandidates() {
  const home = os.homedir();
  const list = [];
  if (process.platform === "win32") {
    list.push(
      path.join(home, ".local", "bin", "youdaonote.exe"),
      path.join(home, "AppData", "Local", "Programs", "youdaonote", "youdaonote.exe"),
    );
  } else {
    list.push(path.join(home, ".local", "bin", "youdaonote"));
  }
  return list;
}

export function resolveYoudaonoteBin() {
  const hit = cliPathCandidates().find((p) => fs.existsSync(p));
  if (hit) return hit;
  const which = spawnSync(process.platform === "win32" ? "where" : "which", [
    "youdaonote",
  ], { encoding: "utf8" });
  if (which.status === 0 && which.stdout.trim()) {
    return which.stdout.trim().split(/\r?\n/)[0];
  }
  return "youdaonote";
}

export function runYoudao(argv) {
  const bin = resolveYoudaonoteBin();
  const env = { ...process.env };
  if (process.platform !== "win32") {
    const localBin = path.join(os.homedir(), ".local", "bin");
    env.PATH = `${localBin}${path.delimiter}${env.PATH || ""}`;
  }
  const r = spawnSync(bin, argv, { encoding: "utf8", env });
  if (r.status === 0) {
    return { ok: true, out: (r.stdout || "").trim() };
  }
  return {
    ok: false,
    err: (r.stderr || r.stdout || `exit ${r.status}`).trim(),
  };
}

export function ensureApiKey() {
  const check = runYoudao(["check"]);
  if (!check.ok) return { ok: false, reason: check.err };
  if (!/✅\s*api-key:|api-key:.*✅/i.test(check.out)) {
    return {
      ok: false,
      reason:
        "API Key 未配置。执行: youdaonote config set apiKey <KEY>  （https://mopen.163.com/#/dashboard）",
    };
  }
  return { ok: true };
}

export function resolveGroupId(groupName) {
  const res = runYoudao(["todo", "groups", "--json"]);
  if (res.ok) {
    try {
      const list = JSON.parse(res.out);
      const hit = list.find((g) => (g.name || g.title) === groupName);
      if (hit?.id) return hit.id;
    } catch {
      /* ignore */
    }
  }
  const created = runYoudao(["todo", "group-create", groupName]);
  if (created.ok) {
    const m =
      created.out.match(/"id"\s*:\s*"([^"]+)"/) ||
      created.out.match(/([0-9a-f-]{20,})/i);
    if (m) return m[1];
  }
  return null;
}

export function shellQuote(s) {
  if (process.platform === "win32") {
    return `"${String(s).replace(/"/g, '\\"')}"`;
  }
  return `"${String(s).replace(/"/g, '\\"')}"`;
}

export function initSyncDir(projectRoot, groupName = "MT-EnjoyAIAppTop") {
  const { syncDir, pending, map } = getSyncPaths(projectRoot);
  fs.mkdirSync(syncDir, { recursive: true });
  if (!fs.existsSync(pending)) {
    const tpl = JSON.parse(
      fs.readFileSync(skillPath("templates", "pending-todos.json"), "utf8"),
    );
    tpl.groupName = groupName;
    fs.writeFileSync(pending, JSON.stringify(tpl, null, 2) + "\n");
  }
  if (!fs.existsSync(map)) {
    const tpl = JSON.parse(
      fs.readFileSync(skillPath("templates", "map.json"), "utf8"),
    );
    tpl.groupName = groupName;
    fs.writeFileSync(map, JSON.stringify(tpl, null, 2) + "\n");
  }
  return { syncDir, pending, map };
}

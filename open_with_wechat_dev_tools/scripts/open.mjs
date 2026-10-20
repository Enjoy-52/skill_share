#!/usr/bin/env node
/**
 * Resolve a uni-app / mp-weixin path and open it in WeChat DevTools.
 *
 * Usage:
 *   node open.mjs <path> [--watch] [--no-open] [--build] [--allow-prod]
 *
 * Path may be:
 *   - uni-app project root (has package.json + pages/ or src/)
 *   - monorepo root containing src/uniapp
 *   - already-built dist/dev/mp-weixin
 *
 * 未上线默认只打开 dist/dev/mp-weixin（开发包）。
 * --build 需同时加 --allow-prod 才会使用 dist/build/mp-weixin。
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MAC_CLI =
  '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const WIN_CLI_CANDIDATES = [
  'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat',
  'C:\\Program Files\\Tencent\\微信web开发者工具\\cli.bat',
];

function usage(code = 1) {
  console.error(`Usage: node open.mjs <path> [--watch] [--build --allow-prod] [--no-open]
  --watch        后台 yarn/npm run dev:mp-weixin，打开 dist/dev/mp-weixin（推荐）
  --build        打生产包（必须同时 --allow-prod）
  --allow-prod   允许打开/使用 dist/build/mp-weixin
  --no-open      只解析/编译，不启动微信开发者工具`);
  process.exit(code);
}

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function isMpWeixinDir(dir) {
  return (
    exists(path.join(dir, 'app.json')) ||
    exists(path.join(dir, 'project.config.json')) ||
    exists(path.join(dir, 'app.js'))
  );
}

function hasUniMpScripts(pkgPath) {
  if (!exists(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const scripts = pkg.scripts || {};
    return Boolean(
      scripts['dev:mp-weixin'] ||
        scripts['build:mp-weixin'] ||
        scripts['dev:mp'] ||
        scripts['build:mp']
    );
  } catch {
    return false;
  }
}

function findUniRoot(input) {
  let cur = path.resolve(input);
  if (!exists(cur)) {
    throw new Error(`路径不存在: ${cur}`);
  }
  const st = fs.statSync(cur);
  if (st.isFile()) cur = path.dirname(cur);

  // Already mp-weixin output
  if (isMpWeixinDir(cur) && /mp-weixin/i.test(cur)) {
    return { uniRoot: null, mpDir: cur };
  }

  const candidates = [
    cur,
    path.join(cur, 'src', 'uni-app'),
    path.join(cur, 'src', 'uniapp'),
    path.join(cur, 'uniapp'),
    path.join(cur, 'uni-app'),
  ];

  for (const c of candidates) {
    if (hasUniMpScripts(path.join(c, 'package.json'))) {
      return { uniRoot: c, mpDir: null };
    }
  }

  // Walk up
  let walk = cur;
  for (let i = 0; i < 6; i++) {
    if (hasUniMpScripts(path.join(walk, 'package.json'))) {
      return { uniRoot: walk, mpDir: null };
    }
    const nested = path.join(walk, 'src', 'uniapp');
    if (hasUniMpScripts(path.join(nested, 'package.json'))) {
      return { uniRoot: nested, mpDir: null };
    }
    const parent = path.dirname(walk);
    if (parent === walk) break;
    walk = parent;
  }

  // Fallback: treat as mp dir if it looks like one
  if (isMpWeixinDir(cur)) {
    return { uniRoot: null, mpDir: cur };
  }

  throw new Error(
    `无法识别 uni-app / mp-weixin 项目: ${input}\n` +
      `请传入 uni-app 根目录、含 src/uniapp 的仓库根，或 dist/.../mp-weixin 产物目录`
  );
}

function resolveMpDir(uniRoot, { allowProd = false } = {}) {
  const devDir = path.join(uniRoot, 'dist', 'dev', 'mp-weixin');
  const buildDir = path.join(uniRoot, 'dist', 'build', 'mp-weixin');
  if (allowProd && isMpWeixinDir(buildDir)) return buildDir;
  return devDir; // 未上线一律开发包
}

function normalizeAwayFromProdBuild(mpDir, { allowProd = false } = {}) {
  if (!mpDir) return mpDir;
  const norm = mpDir.replace(/\\/g, '/');
  if (/\/dist\/build\/mp-weixin\/?$/i.test(norm) || /\/dist\/build\/mp-weixin\//i.test(norm)) {
    if (allowProd) return mpDir;
    const uniGuess = norm.replace(/\/dist\/build\/mp-weixin.*$/i, '');
    const devDir = path.join(uniGuess, 'dist', 'dev', 'mp-weixin');
    console.warn(
      '[open_with_wechat_dev_tools] ⚠ 拒绝打开生产包 dist/build/mp-weixin（未上线请用开发包）'
    );
    console.warn(`[open_with_wechat_dev_tools] → 改用 ${devDir}`);
    return devDir;
  }
  return mpDir;
}

function findCli() {
  if (process.env.WECHAT_DEVTOOLS_CLI && exists(process.env.WECHAT_DEVTOOLS_CLI)) {
    return process.env.WECHAT_DEVTOOLS_CLI;
  }
  if (process.platform === 'darwin' && exists(MAC_CLI)) return MAC_CLI;
  if (process.platform === 'win32') {
    for (const c of WIN_CLI_CANDIDATES) {
      if (exists(c)) return c;
    }
  }
  // Linux / custom install
  const which = spawnSync(
    process.platform === 'win32' ? 'where' : 'which',
    ['cli'],
    { encoding: 'utf8' }
  );
  if (which.status === 0) {
    const line = which.stdout.trim().split(/\r?\n/)[0];
    if (line && exists(line)) return line;
  }
  return null;
}

function runNpm(uniRoot, script, { background = false } = {}) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  console.log(`[open_with_wechat_dev_tools] ${background ? '后台' : ''} npm run ${script} @ ${uniRoot}`);
  if (background) {
    const child = spawn(npm, ['run', script], {
      cwd: uniRoot,
      stdio: 'ignore',
      detached: true,
      env: process.env,
    });
    child.unref();
    return child.pid;
  }
  const r = spawnSync(npm, ['run', script], {
    cwd: uniRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (r.status !== 0) {
    throw new Error(`npm run ${script} 失败 (exit ${r.status})`);
  }
}

function sleep(ms) {
  spawnSync(process.execPath, ['-e', `setTimeout(() => {}, ${ms})`], {
    timeout: ms + 1000,
  });
}

function waitForMpDir(mpDir, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isMpWeixinDir(mpDir)) return true;
    sleep(2000);
  }
  return isMpWeixinDir(mpDir);
}

function openInDevTools(cli, mpDir) {
  console.log(`[open_with_wechat_dev_tools] CLI: ${cli}`);
  console.log(`[open_with_wechat_dev_tools] open --project ${mpDir}`);
  const r = spawnSync(cli, ['open', '--project', mpDir, '--lang', 'zh'], {
    encoding: 'utf8',
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    throw new Error(`微信开发者工具 CLI 失败 (exit ${r.status})`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('-h') || args.includes('--help')) usage(0);

  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const pathArg = args.find((a) => !a.startsWith('--'));
  if (!pathArg) usage(1);

  const wantWatch = flags.has('--watch');
  const wantBuild = flags.has('--build');
  const allowProd = flags.has('--allow-prod');
  const noOpen = flags.has('--no-open');

  if (wantBuild && !allowProd) {
    throw new Error(
      '未上线禁止打/开生产包。请用 --watch（开发包），或显式：--build --allow-prod'
    );
  }

  const { uniRoot, mpDir: givenMp } = findUniRoot(pathArg);
  let mpDir = normalizeAwayFromProdBuild(givenMp, { allowProd });

  if (uniRoot) {
    console.log(`[open_with_wechat_dev_tools] uni-app: ${uniRoot}`);
    mpDir = resolveMpDir(uniRoot, { allowProd: wantBuild && allowProd });
    const pkg = JSON.parse(
      fs.readFileSync(path.join(uniRoot, 'package.json'), 'utf8')
    );
    const scripts = pkg.scripts || {};

    if (wantWatch && (scripts['dev:mp-weixin'] || scripts['dev:mp'])) {
      const script = scripts['dev:mp-weixin'] ? 'dev:mp-weixin' : 'dev:mp';
      runNpm(uniRoot, script, { background: true });
      console.log('[open_with_wechat_dev_tools] 等待开发包编译产物...');
      if (!waitForMpDir(mpDir)) {
        throw new Error(`等待超时，未生成: ${mpDir}`);
      }
    } else if (wantBuild && allowProd && scripts['build:mp-weixin']) {
      runNpm(uniRoot, 'build:mp-weixin');
      mpDir = resolveMpDir(uniRoot, { allowProd: true });
    } else if (!isMpWeixinDir(mpDir)) {
      // Auto: 未上线只走开发包，绝不自动 build
      if (scripts['dev:mp-weixin'] || scripts['dev:mp']) {
        const script = scripts['dev:mp-weixin'] ? 'dev:mp-weixin' : 'dev:mp';
        runNpm(uniRoot, script, { background: true });
        console.log('[open_with_wechat_dev_tools] 自动启动开发包编译...');
        if (!waitForMpDir(mpDir)) {
          throw new Error(`等待超时，未生成: ${mpDir}`);
        }
      } else {
        throw new Error(`未找到 dev:mp-weixin，且开发包不存在: ${mpDir}`);
      }
    } else {
      console.log(`[open_with_wechat_dev_tools] 已有开发包: ${mpDir}`);
    }
  }

  mpDir = normalizeAwayFromProdBuild(mpDir, { allowProd: wantBuild && allowProd });

  if (!mpDir || !isMpWeixinDir(mpDir)) {
    throw new Error(
      `mp-weixin 开发包目录无效: ${mpDir}\n请先: cd uni-app && yarn dev:mp-weixin`
    );
  }

  if (!allowProd && /dist[/\\]build[/\\]mp-weixin/i.test(mpDir)) {
    throw new Error(`仍解析到生产包，已中止: ${mpDir}`);
  }

  console.log(`[open_with_wechat_dev_tools] 项目目录: ${mpDir}`);

  if (noOpen) {
    console.log('[open_with_wechat_dev_tools] --no-open，跳过启动');
    return;
  }

  const cli = findCli();
  if (!cli) {
    throw new Error(
      '未找到微信开发者工具 CLI。\n' +
        'macOS 默认: /Applications/wechatwebdevtools.app/Contents/MacOS/cli\n' +
        '或设置环境变量 WECHAT_DEVTOOLS_CLI'
    );
  }

  openInDevTools(cli, mpDir);
  console.log('[open_with_wechat_dev_tools] ✔ 已请求打开微信开发者工具');
}

try {
  main();
} catch (e) {
  console.error(`[open_with_wechat_dev_tools] ${e.message || e}`);
  process.exit(1);
}

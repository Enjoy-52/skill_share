---
name: open_with_wechat_dev_tools
description: >-
  Opens a WeChat mini program (uni-app mp-weixin) in WeChat Developer Tools
  (微信开发者工具). Parses a following code path: uni-app root, monorepo with
  src/uniapp, or dist/dev/mp-weixin. Use when the user asks to 在微信开发者工具中启动小程序端,
  open/launch 微信开发者工具, import mp-weixin, or invokes open_with_wechat_dev_tools.
---

# open_with_wechat_dev_tools

在微信开发者工具中启动小程序端。

## 何时使用

用户提到以下任一情况时 **立即** 读取并执行本 skill（不要只给口头步骤）：

- 「在微信开发者工具中启动小程序端」
- 打开 / 启动 微信开发者工具 + 小程序 / mp-weixin
- 显式调用 `open_with_wechat_dev_tools`（可带路径）

## 路径解析（必须）

从用户消息中提取路径参数（绝对或相对均可）。优先级：

1. 用户显式给出的路径（如 `/path/to/uniapp`、`src/uniapp`、`dist/dev/mp-weixin`）
2. 当前工作区可推断的 uni-app 根（常见：`src/uniapp`、仓库根下的 `uniapp/`）
3. 若仍无法确定 → 简短询问用户要打开的代码路径

识别规则（脚本已实现）：

| 输入 | 处理 |
|------|------|
| `dist/dev/mp-weixin` 或含 `app.json` 的 mp 产物目录 | 直接打开该目录 |
| uni-app 根（`package.json` 含 `dev:mp-weixin` / `build:mp-weixin`） | 使用其 `dist/dev/mp-weixin`（或 `dist/build/mp-weixin`） |
| 含 `src/uniapp` 的 monorepo 根 | 解析到 `src/uniapp` 再同上 |

## 执行（Agent 必须实际跑命令）

```bash
node ~/.cursor/skills/open_with_wechat_dev_tools/scripts/open.mjs "<代码路径>"
```

**未上线默认只打开 `dist/dev/mp-weixin`（开发包）**，不会自动打生产包。

可选 flag：

| Flag | 含义 |
|------|------|
| （默认） | 优先已有 `dist/dev`；没有则后台 `dev:mp-weixin` 等待产物后 open |
| `--watch` | 后台启动 `dev:mp-weixin`，等开发包产物后 open（推荐） |
| `--build --allow-prod` | 正式上线才用：打/开 `dist/build/mp-weixin`（缺 `--allow-prod` 会拒绝） |
| `--no-open` | 只编译/解析，不调微信 CLI |

禁止：单独 `--build`、或直接打开 `dist/build/mp-weixin` 做日常联调。

Windows：

```bash
node %USERPROFILE%\.cursor\skills\open_with_wechat_dev_tools\scripts\open.mjs "<代码路径>"
```

## CLI 位置

- macOS 默认：`/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- 覆盖：环境变量 `WECHAT_DEVTOOLS_CLI`
- 实际调用：`cli open --project <mp-weixin目录> --lang zh`

若 CLI 不存在：告知用户安装微信开发者工具，或设置 `WECHAT_DEVTOOLS_CLI`。

## 成功判定

- 脚本打印 `✔ 已请求打开微信开发者工具`，或 CLI 输出含 `✔ open`
- 向用户回报：解析到的 uni-app 根、mp-weixin 目录、是否触发了编译

## 示例

```
用户: open_with_wechat_dev_tools /Users/me/EnjoyLife/src/uniapp
→ node ~/.cursor/skills/open_with_wechat_dev_tools/scripts/open.mjs "/Users/me/EnjoyLife/src/uniapp"

用户: 在微信开发者工具中启动小程序端，路径 src/uniapp
→ 解析为工作区绝对路径后执行 open.mjs

用户: 用微信开发者工具打开，并开启 watch
→ .../open.mjs "<path>" --watch
```

## 注意

- 不要只口述「请打开微信开发者工具导入 xxx」——必须执行脚本。
- 不要提交/修改业务代码；本 skill 只负责编译（如需要）与打开 IDE。
- EnjoyLife 等项目若有 `scripts/dev-mp-weixin.js` 补丁逻辑，优先用项目自带的 `npm run dev:mp-weixin` / `build:mp-weixin`，不要绕过。

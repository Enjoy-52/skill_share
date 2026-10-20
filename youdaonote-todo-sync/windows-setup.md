# Windows 部署指南

## 1. 复制 Skill 到本机

将整个文件夹复制到：

```
%USERPROFILE%\.cursor\skills\youdaonote-todo-sync\
```

例如 PowerShell：

```powershell
$dest = "$env:USERPROFILE\.cursor\skills\youdaonote-todo-sync"
New-Item -ItemType Directory -Force -Path $dest
# 从 U 盘/网盘/仓库拷贝整个 youdaonote-todo-sync 目录到 $dest
```

全局规则（可选，从 Mac 拷贝或新建）：

```
%USERPROFILE%\.cursor\rules\youdao-note-todo-sync.mdc
```

## 2. 安装 Node.js

需要 **Node.js 18+**（含 `node` / `npm`）。https://nodejs.org/

验证：

```powershell
node -v
```

## 3. 安装 youdaonote CLI

### 方式 A：官方安装脚本（Git Bash 推荐）

在 **Git Bash** 中执行（与 macOS 相同）：

```bash
curl -fsSL https://artifact.lx.netease.com/download/youdaonote-cli/install.sh | bash
```

安装后确认 `youdaonote` 在 PATH 中（可能需重开终端）。

### 方式 B：PowerShell 安装脚本

在 Skill 目录执行：

```powershell
cd $env:USERPROFILE\.cursor\skills\youdaonote-todo-sync
powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
```

## 4. 配置 API Key

```powershell
youdaonote config set apiKey <你的_KEY>
node $env:USERPROFILE\.cursor\skills\youdaonote-todo-sync\scripts\check-setup.mjs
```

配置文件位置：`%USERPROFILE%\.youdaonote.json`

## 5. 在项目中使用

```powershell
cd C:\path\to\your-project
node $env:USERPROFILE\.cursor\skills\youdaonote-todo-sync\scripts\push.mjs init
# 编辑 .youdao-sync\pending-todos.json
node $env:USERPROFILE\.cursor\skills\youdaonote-todo-sync\scripts\push.mjs
```

完成工作后：

```powershell
node $env:USERPROFILE\.cursor\skills\youdaonote-todo-sync\scripts\done.mjs TASK-001
```

## 6. Cursor 识别 Skill

重启 Cursor 后，Agent 会自动加载 `~/.cursor/skills/` 下的 Skill。描述中含「有道待办」「Youdao todo」时会触发 `youdaonote-todo-sync`。

## 7. 拷贝到新 Windows 机器清单

- [ ] 文件夹 `%USERPROFILE%\.cursor\skills\youdaonote-todo-sync\`
- [ ] 文件 `%USERPROFILE%\.cursor\rules\youdao-note-todo-sync.mdc`（可选）
- [ ] 安装 Node.js
- [ ] 安装 youdaonote CLI + API Key
- [ ] 各项目内的 `.youdao-sync/`（随 git 仓库带走即可）

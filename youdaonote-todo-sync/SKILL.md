---
name: youdaonote-todo-sync
description: Sync project backlog todos to Youdao Cloud Notes (有道云笔记) via youdaonote CLI—push new items to a todo group and mark done when tasks complete. Use when splitting requirements/Sprint work, syncing to 有道待办, MT-* groups, or when user asks to update Youdao todos after finishing work.
---

# 有道云笔记待办同步（全局 Skill）

将项目 backlog（`.youdao-sync/`）与有道云笔记 **待办分组** 双向同步：新增推送、完成打钩。脚本为 **Node.js**，支持 macOS / Linux / **Windows**。

Skill 路径：`~/.cursor/skills/youdaonote-todo-sync/`（可复制到任意机器的 `%USERPROFILE%\.cursor\skills\`）。

## 一次性环境配置

1. **安装 youdaonote CLI**（见 [windows-setup.md](windows-setup.md) 或下方）
2. [网易智能开发者平台](https://mopen.163.com/#/dashboard) 创建 API Key（账号需绑定手机）
3. 配置：
   ```bash
   youdaonote config set apiKey <YOUR_KEY>
   node ~/.cursor/skills/youdaonote-todo-sync/scripts/check-setup.mjs
   ```

### macOS / Linux 安装 CLI

```bash
curl -fsSL https://artifact.lx.netease.com/download/youdaonote-cli/install.sh | bash
```

### Windows

见 [windows-setup.md](windows-setup.md)（PowerShell / Git Bash）。

## 项目初始化（每个仓库一次）

在项目根目录执行：

```bash
node ~/.cursor/skills/youdaonote-todo-sync/scripts/push.mjs init
```

生成 `.youdao-sync/pending-todos.json` 与 `map.json`。默认分组名 `MT-EnjoyAIAppTop`，可用环境变量 `YOUDAO_TODO_GROUP` 或 `--group` 覆盖。

## Agent 工作流（必须执行脚本）

### 1. 新增待办（需求拆分 / Sprint 后）

1. 编辑 `.youdao-sync/pending-todos.json`（`id` 唯一，如 `S-v1.1-A`）。
2. 推送：
   ```bash
   node ~/.cursor/skills/youdaonote-todo-sync/scripts/push.mjs
   ```
3. 确认 `.youdao-sync/map.json` 已有 `youdaoId`。

### 2. 任务完成后打钩（交付门禁）

**在回复用户「已完成」之前**，对每个已交付的 `id`：

```bash
node ~/.cursor/skills/youdaonote-todo-sync/scripts/done.mjs S-v1.1-A
# 多条：node .../done.mjs S-v1.1-A S-v1.1-B
```

### 3. 回复用户时附带

```markdown
**有道待办同步**
- 已打钩：S-v1.1-A
- 已推送：S-v1.1-B
- 分组：MT-EnjoyAIAppTop
```

## 脚本一览

| 脚本 | 作用 |
|------|------|
| `scripts/push.mjs init` | 初始化 `.youdao-sync/` |
| `scripts/push.mjs` | 推送未同步条目 |
| `scripts/done.mjs <id>` | 标记完成 |
| `scripts/check-setup.mjs` | 检查 CLI + API Key |

可选参数：`--root <项目绝对路径>`、`--group <分组名>`。

## 与 Cursor 规则联动

- 全局规则：`~/.cursor/rules/youdao-note-todo-sync.mdc`（`alwaysApply`）
- 项目可保留 `.cursor/rules/` 中的简短引用，脚本**统一用全局 Skill 路径**

## 禁止

- 不要将 API Key 写入仓库
- 不要对已有 `youdaoId` 的 `id` 重复 push
- 不要只口头提醒用户更新有道，必须运行 `done.mjs`

## 更多说明

- Windows 迁移：[windows-setup.md](windows-setup.md)
- 字段约定：[reference.md](reference.md)

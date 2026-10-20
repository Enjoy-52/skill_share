---
name: git-release-branch-tag
description: >-
  Commit and push all changes, create release branch(es) and same-named
  annotated tags, then checkout back to dev. Use when user says 提交并推送到远程git、
  创建分支与同名tag、切回dev、git-release-branch-tag, or passes one or more
  [分支名称] such as releases/v0.3.2.
---

# 提交推送 + 发布分支/同名 Tag → 切回 dev

将用户指令打包为固定流程：

> 提交并推送到远程git，创建[分支名称]，创建同名tag:[分支名称]，切回dev分支

`[分支名称]` 为**必填变量**，可传入**一个或多个**。

## 触发

- 用户点名本 Skill：`git-release-branch-tag`
- 或等价表述：提交并推送、创建发布分支与同名 tag、切回 `dev`

## 参数：`[分支名称]`

| 情况 | 行为 |
|------|------|
| **未传入任何分支名称** | **立即停止**，提示：本 Skill 需要传入变量 `[分支名称]`（可多个），例如：`git-release-branch-tag releases/v0.3.3` 或 `releases/v0.3.3 releases/hotfix-ocr` |
| 传入 1 个 | 创建该分支 + 同名 annotated tag，推送后切回 `dev` |
| 传入多个 | **按顺序**对每个名称执行「建分支 + 同名 tag + 推送」；全部完成后切回 `dev` |

解析规则：

- 从用户消息中提取形如 `releases/...`、`vX.Y.Z`、或明确写在「创建[…]」「tag:[…]」中的名称
- 多个名称可用空格、逗号、中文顿号分隔
- 同一名称的分支与 tag **必须同名**（不要自动改写）
- 若分支名与 tag 同名，推送时必须用完整 ref，避免歧义：
  - `refs/heads/<名称>`
  - `refs/tags/<名称>`

## 执行流程（Agent 必做）

工作目录：当前仓库根（`git rev-parse --show-toplevel`）。

### 0. 校验参数

若没有任何 `[分支名称]` → 只输出提示，不执行 git 写操作。

### 1. 提交并推送（在 `dev` 上）

1. `git status` / `git diff` / `git log -5` 了解变更与提交风格
2. `git checkout dev`（若不在 `dev`）
3. 暂存全部相关变更：`git add -A`（遵守仓库 `.gitignore`）
4. **禁止**提交密钥：`.env`、`*.pem`、`*.key`、真实 `docker-compose.env`、SSL 目录等；若用户点名要提交密钥，警告并跳过
5. 若有可提交变更：按仓库风格写简洁 commit message（heredoc），`git commit`
6. 若工作区干净：跳过 commit，继续后续步骤
7. `git push -u origin HEAD`（或 `origin dev`）

### 2. 为每个 `[分支名称]` 创建分支与同名 tag

对每个名称 `NAME`（顺序执行）：

```bash
# 从当前已推送的 tip（通常为 origin/dev / HEAD）建分支
git branch "NAME" HEAD 2>/dev/null || git checkout -B "NAME"
git tag -a "NAME" -m "NAME"   # 若 tag 已存在：询问用户或报错停止，勿 force

# 分支与 tag 同名时必须用完整 ref
git push -u origin "refs/heads/NAME:refs/heads/NAME"
git push origin "refs/tags/NAME"
```

推荐直接跑脚本（一次传多个名称）：

```bash
bash ~/.cursor/skills/git-release-branch-tag/scripts/create-release-refs.sh NAME [NAME...]
```

脚本假定：**当前 tip 已是要打发布的提交**（步骤 1 完成后）。它会为每个 NAME 建本地分支、annotated tag，并 push；最后 `git checkout dev`。

### 3. 切回 `dev`

```bash
git checkout dev
git status -sb
```

汇报：提交 hash、每个分支/tag 的远程结果、当前分支为 `dev`。

## 安全约束

- 不改 `git config`
- 不 `push --force`、不删远程分支/tag（除非用户明确要求）
- 不 `--no-verify`
- 分支/tag 已存在时：停止并说明，不要覆盖

## 示例

```text
git-release-branch-tag releases/v0.3.3
```

```text
提交并推送到远程git，创建releases/v0.4.0，创建同名tag:releases/v0.4.0，切回dev分支
```

```text
git-release-branch-tag releases/v0.4.0 releases/hotfix-ocr
```

未传变量时的回复模板：

```text
本 Skill 需要传入变量 [分支名称]（可多个）。
示例：git-release-branch-tag releases/v0.3.3
或：git-release-branch-tag releases/v0.3.3 releases/hotfix-ocr
```

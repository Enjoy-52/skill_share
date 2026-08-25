---
name: release-milestone
description: >-
  When a milestone or Phase completes, commit and push work, create branch
  releases/v{version}, tag that release, push tag, and return to dev. Use when
  the user finishes a milestone/Phase, asks for a release branch, version tag,
  or says 发布/里程碑/release. Accepts version as input (e.g. v1.0.0).
---

# Release Milestone（里程碑发布）

完成 **Milestone / Phase** 后，在 **Git 仓库根目录** 执行本流程：提交并推送 → 创建 `releases/v{version}` 分支 → 打 tag → 切回 `dev`。

## 入口参数

| 参数 | 必填 | 说明 |
|------|------|------|
| **version** | 是 | 版本号，如 `v1.0.0` 或 `1.0.0` |
| **commit_message** | 否 | 提交说明 |
| **repo_root** | 否 | Git 根路径 |
| **base_branch** | 否 | 默认 `dev` |
| **dry_run** | 否 | 只打印命令 |

- 发布分支：`releases/v1.0.0`
- 标签：`v1.0.0`

## 执行脚本

**Windows（项目内）**

```powershell
.\.cursor\skills\release-milestone\scripts\release.ps1 -Version "v1.0.0"
```

**通用（任意仓库，需先把脚本拷到仓库或指定路径）**

```powershell
& "C:\Users\HLSC\.cursor\skills\release-milestone\scripts\release.ps1" `
  -Version "v1.0.0" `
  -RepoRoot "E:\path\to\git-repo"
```

**Bash**

```bash
REPO_ROOT=/path/to/repo ./release.sh v1.0.0
```

个人脚本目录：`C:\Users\HLSC\.cursor\skills\release-milestone\scripts\`

## Agent 手工步骤（脚本不可用时）

1. 确认无 `.env`/密钥入库
2. `git checkout dev` && `git pull origin dev`
3. 有改动则 `git add` + `git commit` + `git push origin dev`
4. `git checkout -b releases/v1.0.0` && `git push -u origin releases/v1.0.0`
5. `git tag -a v1.0.0 -m "Release v1.0.0"` && `git push origin v1.0.0`
6. `git checkout dev`

## Git 安全

- 禁止对 `main`/`master`/`dev` 做 force push（除非用户明确要求）
- 禁止改 `git config`
- 禁止擅自 `--no-verify`

## 完成后

向用户报告：版本、发布分支、tag、已切回 `dev`、远程推送结果。

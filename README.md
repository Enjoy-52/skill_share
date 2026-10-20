# skill_share

共享 Cursor Agent Skills，供团队安装与复用。

本仓库同步自本机全局目录 `~/.cursor/skills/`（通用 Skill），供多项目 / 多同事复用。

## 已收录

| Skill | 说明 |
|-------|------|
| [android-mirror-ios](./android-mirror-ios/) | - Forces Android UI/UX to fully replicate the iOS counterpart with no style innovation; Kotlin-fi… |
| [auto-rd-loop](./auto-rd-loop/) | - 依据本机资源启动自动研发Loop，任务时间间隔依据硬件配置自动设定。 Probes local CPU/RAM/load, picks a loop interval, then arms … |
| [cn-video-download](./cn-video-download/) | - Downloads videos from Bilibili (B站), Douyin (抖音), and WeChat Channels (微信视频号) to local MP4 file… |
| [compressed-pdf](./compressed-pdf/) | - Compress PDF files to a target size (default 4.2MB) by recompressing embedded images with PyMuP… |
| [crisp-prompt](./crisp-prompt/) | - Optimizes user instructions into CRISP六原则 prompts (Context/Role/Input/Steps/Output/约束). Use whe… |
| [csdn-tech-blog](./csdn-tech-blog/) | - Renders CSDN/tech blog articles with standardized footer (contact, CC license, update log, seri… |
| [deplop-aliyun-ecs](./deplop-aliyun-ecs/) | - Deploys projects to Aliyun ECS via deploy/deploy-ecs.sh with SSH/env config import. Use when th… |
| [docker-compose-package](./docker-compose-package/) | - Rebuilds and redeploys local services via Docker Compose (--build / up -d). Use when the user s… |
| [git-release-branch-tag](./git-release-branch-tag/) | - Commit and push all changes, create release branch(es) and same-named annotated tags, then chec… |
| [open_with_wechat_dev_tools](./open_with_wechat_dev_tools/) | - Opens a WeChat mini program (uni-app mp-weixin) in WeChat Developer Tools (微信开发者工具). Parses a f… |
| [parallel-agent-orchestrate](./parallel-agent-orchestrate/) | - Decomposes a user prompt into isolated parallel subagent tasks, runs them concurrently via Task… |
| [project-analysis](./project-analysis/) | Use when asked to analyze, onboard, reverse-engineer, document, evaluate, audit, or plan non-triv… |
| [release-milestone](./release-milestone/) | - When a milestone or Phase completes, commit and push work, create branch releases/v{version}, t… |
| [repo_graph](./repo_graph/) | - Reads and understands a repository's structure, uses CodeGraph to map modules and relationships… |
| [summary-daily-work](./summary-daily-work/) | - 按六段日报模板（目标/已完成工作/解决的问题/剩余问题/总结/下一步建议）输出可复制的今日工作日报。 Use when the user says summary-daily-work, 工… |
| [summary-daily-work-hl-tender](./summary-daily-work-hl-tender/) | - 为 hl-tender 项目生成六段式 IT 工程师工作日报，并写入月度绩效软件组日报目录。 Use when the user says summary-daily-work-hl-ten… |
| [summary-work](./summary-work/) | - Summarizes the current session into goal, completed work, key decisions, remaining issues, and … |
| [summary-work-coding](./summary-work-coding/) | - Summarizes coding work in a fixed four-part report: what changed, which files, why each file ch… |
| [token-cost](./token-cost/) | - Global Cursor per-turn Token usage reporter. Use when the user asks for token usage, Token 用量, … |
| [youdaonote-todo-sync](./youdaonote-todo-sync/) | Sync project backlog todos to Youdao Cloud Notes (有道云笔记) via youdaonote CLI—push new items to a t… |

## 安装

将对应目录复制到本机 Cursor skills 目录。把下面的 `<skill-name>` 换成上表中的目录名。

### macOS / Linux

```bash
# 全局 skills（所有项目可用）
cp -R <skill-name> ~/.cursor/skills/

# 或项目内 skills
cp -R <skill-name> /path/to/project/.cursor/skills/
```

一次性安装全部：

```bash
for d in android-mirror-ios auto-rd-loop cn-video-download compressed-pdf crisp-prompt csdn-tech-blog deplop-aliyun-ecs docker-compose-package git-release-branch-tag open_with_wechat_dev_tools parallel-agent-orchestrate project-analysis release-milestone repo_graph summary-daily-work summary-daily-work-hl-tender summary-work summary-work-coding token-cost youdaonote-todo-sync; do
  cp -R "$d" ~/.cursor/skills/
done
```

### Windows（PowerShell）

```powershell
# 全局 skills（所有项目可用）
Copy-Item -Recurse <skill-name> $env:USERPROFILE\.cursor\skills\

# 或项目内 skills
Copy-Item -Recurse <skill-name> path\to\project\.cursor\skills\
```

一次性安装全部：

```powershell
$skills = @(
  'android-mirror-ios',
  'auto-rd-loop',
  'cn-video-download',
  'compressed-pdf',
  'crisp-prompt',
  'csdn-tech-blog',
  'deplop-aliyun-ecs',
  'docker-compose-package',
  'git-release-branch-tag',
  'open_with_wechat_dev_tools',
  'parallel-agent-orchestrate',
  'project-analysis',
  'release-milestone',
  'repo_graph',
  'summary-daily-work',
  'summary-daily-work-hl-tender',
  'summary-work',
  'summary-work-coding',
  'token-cost',
  'youdaonote-todo-sync'
)
foreach ($s in $skills) {
  Copy-Item -Recurse $s $env:USERPROFILE\.cursor\skills\
}
```

若 `.cursor\skills` 目录尚不存在，先创建：

```powershell
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.cursor\skills
```

也可在本仓库中直接浏览 `SKILL.md` 后按需同步。

## 维护

从本机全局 skills 更新本仓库：

```bash
GLOBAL=~/.cursor/skills
SHARE=/path/to/skill_share
for d in "$GLOBAL"/*/; do
  name=$(basename "$d")
  rsync -a --delete --exclude '.DS_Store' --exclude 'node_modules' "$d" "$SHARE/$name/"
done
# 然后更新本 README 表格并 git commit / push
```

---
name: summary-work-coding
description: >-
  Summarizes coding work in a fixed four-part report: what changed, which files,
  why each file changed, verification commands and results. Use when the user says
  summary-work-coding, 总结这次改动, 总结改动, 工作总结, change summary, or asks to
  list modified files with reasons and verification after a coding session.
---

# summary-work-coding · 编码工作总结

简要指令：`summary-work-coding`（等同于「总结这次改动」）。

读完本 Skill 后，基于**本轮对话中已完成的改动与已执行的验证**，直接输出总结；不要先追问无关细节。

## 必须回答的四问（用户原文）

总结这次改动，改动哪些文件，每个文件为什么要改，运行了什么验证命令，结果是什么。

## 工作流

1. 从本轮对话收集：新建/修改/删除的文件路径、改动意图、已跑过的命令与输出要点。
2. 用 `git status` / `git diff --stat`（若在 Git 仓库且有助于核对）核对路径；**不得编造**未改过的文件或未跑过的命令。
3. 按下方模板输出；某段无材料时写「无」或「未执行」，禁止用猜测填满。
4. 默认只输出总结正文；用户要求讲解时再附简短说明。

## 输出模板（标题必须原样使用）

```markdown
## 总结这次改动

<2–5 句：本轮目标、做了什么、当前状态/遗留问题>

## 改动哪些文件

| 文件 | 动作 |
|------|------|
| `path/to/file` | 新建 / 修改 / 删除 |

## 每个文件为什么要改

| 文件 | 原因 |
|------|------|
| `path/to/file` | <一句：解决什么问题 / 满足什么需求> |

## 运行了什么验证命令，结果是什么

| 命令 | 结果 |
|------|------|
| `exact command` | <PASS/FAIL/要点；可贴关键退出码或一行关键输出> |

未跑验证时写：**未执行验证。**
```

## 填写要点

| 段 | 要求 |
|----|------|
| 总结 | 说清「为什么做」与「做到哪」；不复述整段对话 |
| 文件列表 | 路径相对仓库根或用户工作区；含新建 README/配置等文档改动 |
| 原因 | 按文件一行；合并无关碎改到同一意图时可在总结段点明 |
| 验证 | 只列本轮真实执行过的命令；含构建、测试、健康检查、预览、curl/nc 等 |

## 约束

- 不得编造未见过的内容（未改文件、未跑命令、未观察到的结果）。
- 不把「计划要做」写成「已完成」。
- 不主动 commit / push，除非用户另有要求。
- 输出使用用户当前对话语言（默认简体中文）。

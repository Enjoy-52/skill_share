---
name: summary-work
description: >-
  Summarizes the current session into goal, completed work, key decisions,
  remaining issues, and a short wrap-up using a fixed Chinese template. Use when
  the user says summary-work, 总结当前任务, 总结进度, 阶段总结, session summary, or asks
  to consolidate goals / done / decisions / open questions.
---

# summary-work · 任务阶段总结

简要指令：`summary-work`（等同于「总结当前任务目标、已完成内容、关键决策、剩余问题」）。

读完本 Skill 后，基于**本轮（或用户指定范围）对话与已发生事实**，直接按模板输出；不要先追问无关细节。

## 工作流

1. 从对话收集：任务目标、已落地成果、已拍板决策、未决问题与下一步。
2. 只写有依据的内容；某段无材料时写「无」，禁止用猜测填满。
3. 按下方模板输出；标题与分段格式必须原样使用。
4. 默认只输出总结正文；用户要求讲解时再附简短说明。

## 输出模板（标题必须原样使用）

```markdown
【目标】
1. 
2. 

【已完成内容】
1. 
2. 

【关键决策】
1. 
2. 

【剩余问题】
1. 
2. 

【总结】
1. 
2. 
```

## 填写要点

| 段 | 要求 |
|----|------|
| 目标 | 本阶段要达成什么；条目化，可含验收口径 |
| 已完成内容 | 已落地的结果（功能/文档/配置/验证等）；不写「计划要做」 |
| 关键决策 | 已拍板的取舍（方案、边界、不做项）；写清「选了什么 / 为何」 |
| 剩余问题 | 阻塞、待确认、未完成项；可带建议下一步 |
| 总结 | 2–5 条：当前状态、风险/依赖、建议优先事项 |

条目数量按实际增减；至少保留各段标题。无内容的段写：

```markdown
【关键决策】
1. 无
```

## 约束

- 不得编造未见过的目标、完成项、决策或问题。
- 不把「计划要做」写成「已完成」。
- 与编码改动清单类总结区分：文件级改动/验证请用 `summary-work-coding`；本 Skill 偏任务阶段与决策收口。
- 输出使用用户当前对话语言（默认简体中文）。

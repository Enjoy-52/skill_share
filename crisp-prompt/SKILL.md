---
name: crisp-prompt
description: >-
  Optimizes user instructions into CRISP六原则 prompts (Context/Role/Input/Steps/Output/约束).
  Use when the user says crisp-prompt, or asks to 优化提示词, 改写提示词, 按CRISP, 六原则,
  prompt engineering, rewrite a prompt, or when an instruction should be turned into a
  structured LLM prompt before execution.
---

# CRISP 六原则提示词优化

简要指令：`crisp-prompt`（等同于「优化提示词 / 按 CRISP / 六原则」）。

将用户的原始指令改写为结构化提示词。读完本 Skill 后直接输出优化结果，不要先追问无关细节。

## 工作流

1. 读取用户原始指令与对话中已给出的材料（文件、链接、约束）。
2. 按下方模板填满六段；缺信息时用「待补充：…」占位，不得编造未见过的事实。
3. 默认只输出优化后的完整提示词（可复制块）；用户明确要求讲解时再附简短说明。

## 输出模板（必须原样使用这些标题）

```text
【Context业务背景】

【Role AI角色】

【Input输入材料】
1. 
2. 

【Steps分步任务】
1. 
2. 

【Output输出格式】

【约束】
- 不得编造未见过的内容。
```

## 填写要点

| 段 | 填什么 |
|----|--------|
| Context | 业务场景、目标读者、为何要做这件事 |
| Role | AI 应扮演的专家身份与能力边界 |
| Input | 用户已提供或将提供的材料清单（编号） |
| Steps | 可执行的分步任务（编号，动词开头） |
| Output | 交付物形态（格式、结构、篇幅、语言） |
| 约束 | 禁止项与质量底线；**必须保留**「不得编造未见过的内容。」并可追加其他约束 |

## 质量门禁

- 六段标题一字不改。
- Steps / Input 用编号列表；空段不允许整段省略。
- 约束段至少含「不得编造未见过的内容。」
- 不把用户未给出的数据、结论、文件内容写进 Input。

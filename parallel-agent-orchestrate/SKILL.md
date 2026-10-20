---
name: parallel-agent-orchestrate
description: >-
  Decomposes a user prompt into isolated parallel subagent tasks, runs them
  concurrently via Task tool, then merges results without cross-interference.
  Use when the user says 按提示词自动将任务进行分解、同时启动多个智能体并行工作、
  最后再做结果合并、相互不影响、并行智能体、multi-agent parallel merge、
  parallel-agent-orchestrate, or asks to split work across multiple agents
  and consolidate at the end.
---

# Parallel Agent Orchestrate（分解 → 并行 → 合并）

**Verbatim trigger（用户原话，保持原样）：**

> 按提示词自动将任务进行分解，同时启动多个智能体并行工作，最后再做结果合并，相互不影响

读完本 Skill 后**立即按工作流执行**，不要只解释流程。全局路径：`~/.cursor/skills/parallel-agent-orchestrate/`（Windows：`%USERPROFILE%\.cursor\skills\parallel-agent-orchestrate\`）。

## When

**默认（全局规则 `~/.cursor/rules/parallel-agent-default.mdc`）**：凡复合目标可切开写路径，**自动**分解并行，无需用户再说「请并行」。

仍适用：

- 用户给出**复合目标**（≥2 个可并行交付面：代码/文档/部署/调研等）
- 用户明确要求「分解 / 多智能体 / 并行 / 合并 / 互不影响」
- 单智能体串行会明显拖慢，且工作面可按路径/职责切开

**不要用**于：单文件热修、必须严格串行的依赖链（先 A 产出再 B）、纯问答。用户明确要求串行时服从。

## 核心原则：相互不影响

| 规则 | 做法 |
|------|------|
| 写隔离 | 每个子任务声明 **唯一可写路径集合**；集合两两不相交 |
| 读共享 | 允许只读公共代码/文档；禁止改他人领地 |
| 职责单一 | 一个智能体一个交付面（如「微信 MWEB」「调价 API」「调研文档」「部署」） |
| 父代理仲裁 | 冲突、跨边界改动、最终 typecheck/合并说明只由 **parent** 做 |
| 密钥 | 子代理输出禁止打印 `.env` / 密钥明文 |

若无法切开写路径 → **不要硬并行**；改为串行或缩小为 1 个智能体。

## Workflow

### 1. 分解（parent，同步）

根据用户提示词产出计划（可写进 TODO，勿冗长）：

```text
并行计划：
- A: <目标> | 可写: <paths> | 验证: <cmd>
- B: <目标> | 可写: <paths> | 验证: <cmd>
- C: <目标> | 可写: <paths> | 验证: <cmd>
串行/父代理保留: <部署密钥、跨包合并、最终验收>
```

分解启发式：

1. **按交付物**：功能闭环 / 交互优化 / 文档调研 / 部署运维
2. **按目录**：`backend-service` / `frontend-*` / `docs` / `deploy`（避免两代理同改一文件）
3. **按风险**：有密钥的部署留给 parent 或单独一代理且禁止改业务代码
4. **上限**：默认 **2–4** 个并行智能体；超过则合并弱相关项

可选：用脚本生成骨架 JSON（不替代人工审视）：

```bash
python3 ~/.cursor/skills/parallel-agent-orchestrate/scripts/decompose_stub.py \
  --goal "用户原句或摘要" --out /tmp/parallel-plan.json
```

### 2. 并行启动（同一条 parent 消息内）

对每个切片调用 **Task** 工具，`run_in_background: true`，`subagent_type` 默认 `generalPurpose`（探查用 `explore`）。

每个子代理 prompt **必须**包含固定骨架（详见 [reference.md](reference.md)）：

1. 仓库绝对路径  
2. 本切片目标（一句）  
3. **可写路径白名单**（硬约束）  
4. **禁止改动**列表  
5. 完成定义 + 最小验证命令  
6. 「完成后返回：改动文件列表 + 验证结果 + 风险；勿泄密」

**同一轮**发出全部 Task 调用（真正并行）。Parent 可同时跑自己的 Shell（如部署），但勿与子代理写同一文件。

### 3. 等待与收集

- 不要空转轮询；可继续处理 parent 自有工作
- 子代理完成后根据回报收集：`files` / `verify` / `blockers`
- 若某切片失败：只重跑该切片（缩小 prompt），勿重开全部

### 4. 结果合并（parent）

按顺序：

1. **路径审计**：若两代理改了同一文件 → parent 手工合并或保留一方并回滚另一方冲突段  
2. **统一验证**：在工程根跑最小相关检查（如 `typecheck` / smoke）  
3. **补洞**：子代理遗漏的跨包接线（import、路由注册）由 parent 补  
4. **用户汇报**（简体中文）用下方模板

```markdown
## 并行编排结果
- 分解：A / B / C …
- 并行：均已结束 | 失败项：…
- 合并：冲突 <无/有及处理>；验证 <通过/失败>
- 交付要点：…
- 未完成 / 需你提供：…
```

## 与其它 Skill 的边界

| 场景 | 用谁 |
|------|------|
| 复合任务要并行切开 | **本 Skill** |
| 定时继续同一研发目标 | `auto-rd-loop` |
| 只部署阿里云 ECS | `deplop-aliyun-ecs` |
| 只做仓库结构分析 | `project-analysis` / `repo_graph` |

可组合：本 Skill 切出「部署」切片后，部署切片内再遵循对应 deploy Skill。

## Anti-patterns

- 两个智能体同时改 `App.tsx` / 同一 `index.ts`
- 子代理「顺便」重构公共 shared 大爆炸（除非该切片独占 shared）
- 并行后不做 typecheck 就宣称完成
- 把密钥贴进 Task prompt 正文（改为「从 config/local/*.env 读取，勿回显」）

## Additional resources

- 子代理 prompt 模板与隔离清单：[reference.md](reference.md)
- 分解骨架脚本：`scripts/decompose_stub.py`

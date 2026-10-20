---
name: repo_graph
description: >-
  Reads and understands a repository's structure, uses CodeGraph to map modules
  and relationships, then writes Mermaid project diagrams under docs/repo-graph/.
  Use when the user says repo_graph, 项目结构图, codegraph 图示, 绘制项目图, architecture
  diagram from codegraph, or asks to document repo structure with graphs.
---

# repo_graph · 项目结构图示

简要指令：`repo_graph`（等同于「阅读和理解整个项目结构，使用 codegraph 绘制项目相关图示，存放到根目录的 docs 对应目录中」）。

读完本 Skill 后立即执行；默认工作区根目录为当前项目根。不要先追问无关细节。

## 目标

1. 用 CodeGraph 建立/刷新本地代码知识图，理解项目结构与关键路径。
2. 产出可维护的 Mermaid 图示（辅以简短说明），写入 `docs/repo-graph/`。
3. 交付时给出已生成文件路径清单；图示必须能从 CodeGraph 证据回溯，禁止空泛臆造。

## 前置检查

1. 确认 CLI：`codegraph --version`（目标包 `@colbymchenry/codegraph`）。
2. 若命令不存在：提示安装 `npm i -g @colbymchenry/codegraph`（或官方 install 脚本），安装成功后再继续；不要静默改用纯 grep 冒充「已用 codegraph」。
3. 在项目根执行索引：
   - 无 `.codegraph/` → `codegraph init`
   - 已有索引 → `codegraph sync`（或 `codegraph status` 确认后按需 `sync`/`index`）
4. 索引失败时：尝试 `codegraph unlock` 后重试；仍失败则记录原因，仅用只读文件盘点补全「目录树」类图，并在交付中标明哪些图未经 CodeGraph 验证。

## 工作流

```
Task Progress:
- [ ] 1. 索引就绪（init/sync/status）
- [ ] 2. 结构盘点（files + 顶层 manifests）
- [ ] 3. 关键路径探索（explore / node / callers|callees|impact）
- [ ] 4. 合成图示并写入 docs/repo-graph/
- [ ] 5. 写 README 索引并核对链接
```

### 1. 结构盘点

优先用 CodeGraph，少做盲目全库 Read：

```bash
codegraph status -p .
codegraph files -p . --format tree --max-depth 3
codegraph files -p . --format grouped --json
```

再快速确认：README、package/workspace/build 清单、主要入口脚本、`src`/`apps`/`packages` 边界。忽略 `node_modules`、`dist`、`.git`、缓存与明显 vendored 目录，除非它们是分析对象。

### 2. 关键路径探索

默认入口命令（与 MCP `codegraph_explore` 同形）：

```bash
codegraph explore -p . "project architecture overview entrypoints modules"
codegraph explore -p . "how does the main app start and reach core features"
```

按项目形状补 2–5 次定向探索，例如：

- 前端：`routing` / `store` / `designer canvas` / `form schema`
- 后端：`HTTP routes` / `auth` / `db access`
- monorepo：各 package 边界与跨包依赖
- 库：public API → 内部实现

需要定点关系时再用：

```bash
codegraph query -p . "<symbol>" -j
codegraph node -p . <symbol>
codegraph callers -p . <symbol> -j
codegraph callees -p . <symbol> -j
codegraph impact -p . <symbol> -d 2 -j
```

信任 CodeGraph 结果，不要用大范围 grep 重复验证同一事实；编辑代码后注意索引是否需 `sync`。

### 3. 产出目录与文件

在**仓库根**创建（已存在则更新，不整目录无脑覆盖用户手写补充）：

```text
docs/repo-graph/
├── README.md                 # 图示索引 + 生成说明
├── 01-directory-structure.md
├── 02-architecture-overview.md
├── 03-module-dependencies.md
├── 04-main-flows.md
└── 05-call-impact.md         # 可选：1–3 个高价值符号
```

命名约定：

- 使用两位序号前缀，便于阅读顺序。
- 文件名英文短横线；正文默认简体中文（与用户对话语言一致时可跟随）。
- 每个 `.md` 以 1–3 个 Mermaid 代码块为主，前后各一段极短说明（目的 / 读图要点 / 证据来源）。

若用户指定了别的 docs 子目录，改存到该目录，但仍保持同一套文件集合与 README 索引。

### 4. 图示内容要求

| 文件 | 必须回答 | 建议 Mermaid |
|------|----------|--------------|
| `01-directory-structure` | 顶层目录职责与主要子树 | `flowchart` 或缩进树 + 简表 |
| `02-architecture-overview` | 运行时边界、入口、分层 | `C4Context` 风格的 `flowchart` / `graph` |
| `03-module-dependencies` | 核心模块/包之间依赖方向 | `flowchart LR` 或 `graph` |
| `04-main-flows` | 1–3 条主路径（启动、核心业务、扩展点） | `sequenceDiagram` 或 `flowchart TD` |
| `05-call-impact` | 选定符号的调用/影响面 | `flowchart`（来自 callers/callees/impact） |

规则：

- 节点用真实模块/包/符号名；边表示真实依赖或调用，不画装饰性假关系。
- 单图节点宜 ≤ 25；过大则拆子图或只保留核心层。
- 每个图下方用列表写「证据」：用过的 `codegraph` 命令或关键路径（文件路径即可）。
- 不确定处标注「推断」，并写开放问题，不装成已证实。

### 5. README 模板

`docs/repo-graph/README.md` 必须包含：

```markdown
# 项目结构图示（repo_graph）

- 生成时间：<ISO 日期>
- 工具：CodeGraph (`codegraph --version` 输出)
- 索引：<.codegraph 状态摘要>

## 图示索引

1. [目录结构](./01-directory-structure.md)
2. [架构总览](./02-architecture-overview.md)
3. [模块依赖](./03-module-dependencies.md)
4. [主流程](./04-main-flows.md)
5. [调用与影响面](./05-call-impact.md)  <!-- 若未生成则删除本行 -->

## 如何更新

在仓库根执行：`repo_graph`（或让 Agent 按本 Skill 重跑）。
优先 `codegraph sync` 后再重绘变更相关图。
```

## 交付回复

用简体中文回复，包含：

1. 一句话项目形态判断（单应用 / monorepo / 库 …）。
2. 已写入的文件路径列表。
3. 若有跳过的图或索引问题，各用一句话说明。

不要把完整大图再贴进聊天（文件里已有）；聊天里最多摘 1 个最关键的小图。

## 约束

- 只写 `docs/repo-graph/`（或用户指定的 docs 子目录）与索引维护所需的最少文件；不借机重构业务代码。
- 不提交 git、不 `codegraph uninit`、不删除用户已有文档，除非用户明确要求。
- 不打印密钥；配置里若出现密钥只描述「存在」，不写值。
- 与全面项目分析区分：深度审计用 `project-analysis`；本 Skill 专注 **CodeGraph → docs 图示落地**。
- CLI 细节与排错见 [reference.md](reference.md)。

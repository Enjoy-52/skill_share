---
name: auto-rd-loop
description: >-
  依据本机资源启动自动研发Loop，任务时间间隔依据硬件配置自动设定。
  Probes local CPU/RAM/load, picks a loop interval, then arms a recurring R&D
  tick that continues the current coding task. Use when the user says 自动研发Loop,
  本机资源, 硬件配置自动设定间隔, auto R&D loop, hardware-based loop interval,
  or asks to keep iterating development on a schedule derived from machine capacity.
---

# Auto R&D Loop（本机资源自适应）

**Verbatim trigger（用户原话，保持原样）：**

> 依据本机资源启动自动研发Loop，任务时间间隔依据硬件配置自动设定

读完本 Skill 后立即执行，不要先追问无关细节。研发 tick 的唤醒机制遵循全局 Loop Skill：`~/.cursor/skills-cursor/loop/SKILL.md`。

## When

- 用户要求按本机资源启动自动研发 Loop
- 用户未给出固定间隔，或明确要求间隔随硬件自动设定
- 需要在当前会话中持续推进编码 / 构建 / 修复，直到用户叫停

## Workflow

### 1. Probe hardware → interval

在工作区执行（优先，勿手算）：

```bash
python3 ~/.cursor/skills/auto-rd-loop/scripts/probe-hw-interval.py
```

Windows：

```bash
python %USERPROFILE%\.cursor\skills\auto-rd-loop\scripts\probe-hw-interval.py
```

解析 stdout JSON，使用字段：

| 字段 | 用途 |
|------|------|
| `interval_seconds` | Loop 的 sleep / `delaySeconds` |
| `interval_label` | 对用户确认时的短标签（如 `5m`） |
| `reason` | 简短说明为何选该间隔 |

脚本规则（已实现，勿改公式除非用户要求）：

- 算力分高（核数 + 内存）→ **更短**基础间隔（更强机器可更勤 tick）
- `load1 / cores` 高 → **拉长**间隔（避免本机过载）
- 夹在 `60s`–`30m`

若脚本失败：回退 `5m`，并在确认里写明「探测失败，已回退 5m」。

若用户**显式**给出间隔（如 `2m`），以用户为准，仍可跑探测仅作对比说明。

### 2. Define the R&D tick prompt

`purpose` 固定为 `auto-rd`（sentinel / 订阅名用此后缀，避免冲突）。

每轮 tick 的 `prompt`（可按任务微调，但须保留骨架）：

```text
【自动研发Loop tick】继续当前工作区未完成的研发目标。
1. 读取对话与仓库现状，选出下一步可交付的最小切片。
2. 实现或修复；优先复用既有模式；少文件、可验证。
3. 跑最小验证（build/test/lint 中最相关的一项）。
4. 用简体中文简报：本轮完成 / 阻塞 / 下一步；勿重复大段无关上下文。
5. 若目标已完成：停止 Loop（杀 PID / unsubscribe），并向用户确认收工。
6. 若仍未完成：保持 Loop 运行（固定间隔）或按 loop Skill 的 dynamic 规则重臂下一次唤醒。
```

默认把「当前用户任务 / 未完成 TODO」当作研发目标。若会话无明确目标，先用一轮探查列出候选，再进入 Loop。

### 3. Arm the Loop

1. 读取并遵循 `~/.cursor/skills-cursor/loop/SKILL.md`。
2. **先立即执行一轮**上述 R&D prompt（冷启动）。
3. 再按环境装唤醒：
   - **Cloud Agent** 且有 `cursor-subscriptions-subscribe_timer`：  
     `name=loop-auto-rd`，`delaySeconds=<interval_seconds>`，`prompt` 为上节全文。
   - **本地 IDE/CLI**：monitored shell 固定间隔：

```bash
while true; do
  sleep <interval_seconds>
  echo 'AGENT_LOOP_TICK_auto-rd {"prompt":"<R&D tick prompt JSON-escaped>"}'
done
```

   - `notify_on_output.pattern`: `^AGENT_LOOP_TICK_auto-rd`
   - Shell 标题：`Loop every <interval_label>: auto R&D`
   - 检查是否已有同名 loop，禁止重复武装
   - Smoke-check 一次确认启动干净；记录 PID

4. 向用户确认（简短）：
   - 探测摘要（cores / mem / load / interval）
   - 已跑完第一轮
   - 下一 tick 预计时间
   - 如何停止（「停止自动研发Loop」）

### 4. On each wake

1. 读最新 sentinel 行里的 `prompt`。
2. 执行研发 tick。
3. **不要**每轮重跑硬件探测，除非用户要求「按负载重算间隔」或本机明显过载（构建 OOM、load_ratio≥2 持续）。
4. 需要改间隔时：先停旧 loop，再用新 `interval_seconds` 重臂（cloud 须先 unsubscribe）。

### 5. Stop

用户说停止 / 收工 / stop loop，或 tick 判定目标已完成：

1. Kill 本地 loop/sleeper PID，或 `unsubscribe` 云端 `loop-auto-rd`。
2. Await/消费完成通知，避免幽灵唤醒。
3. 一句话确认已停止及原因。
4. 不再武装下一次心跳。

## Constraints

- 不得编造未见过的产品事实、下载 URL、密钥。
- 不自动 `git commit` / `push`，除非用户本轮明确要求。
- 不并行开多个 `auto-rd` loop。
- 单 tick 保持最小可验证切片；避免无验证的大重构。
- 回复语言：简体中文（用户另有要求除外）。

## Examples

| 用户说 | Agent 做 |
|--------|----------|
| 依据本机资源启动自动研发Loop，任务时间间隔依据硬件配置自动设定 | probe → 立即研发一轮 → 按 JSON 间隔武装 loop-auto-rd |
| 自动研发Loop，间隔跟硬件走 | 同上 |
| 停止自动研发Loop | 停 PID / unsubscribe，确认收工 |

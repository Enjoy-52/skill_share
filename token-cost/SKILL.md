---
name: token-cost
description: >-
  Global Cursor per-turn Token usage reporter. Use when the user asks for token
  usage, Token 用量, 消耗统计, cache tokens, or to summarize ~/.cursor/token-usage
  history. Also apply when a message starts with ⟦TOKEN_USAGE⟧ (echo footer only).
---

# Token Cost（Cursor）

Cursor 的权威 Token 数据来自 Hooks 的 `stop` 载荷（`input_tokens` / `output_tokens` / `cache_read_tokens` / `cache_write_tokens`），不是 agent transcript。

`stop` hook 在每轮完成后会注入 `⟦TOKEN_USAGE⟧` 短回合；Agent **只原样回显**哨兵后正文。

## 哨兵脚注

若用户消息以 `⟦TOKEN_USAGE⟧` 开头：把其后正文原样输出，禁止工具与改写。

## 查询历史

1. 先完成用户问题。
2. 最后执行：

```bash
python3 ~/.cursor/skills/token-cost/scripts/report_token_usage.py --format report --last 20
```

Windows：

```bash
python %USERPROFILE%\.cursor\skills\token-cost\scripts\report_token_usage.py --format report --last 20
```

3. 按脚本 stdout **原样**贴到回复末尾。不可用时原样给出脚本错误，禁止估算。

## 输出格式（单轮脚注）

```text
Token 用量（本轮 parent agent）：总计 N（输入 N，其中缓存读 N / 缓存写 N；未缓存 N；输出 N）
模型：… · 耗时 …
```

## 准确性

- 只报告脚本/Hooks 写出的数字。
- parent-only：不含 subagent。
- `input_tokens` 含 cache_read + cache_write；未缓存 = max(0, input - read - write)。
- 不推断金额，除非用户提供单价表。

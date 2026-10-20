#!/usr/bin/env python3
"""Report Cursor Token usage recorded by user hooks. Sentinel only at the end."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

DATA_DIR = Path.home() / ".cursor" / "token-usage"
LATEST_PATH = DATA_DIR / "latest.json"
TURNS_PATH = DATA_DIR / "turns.jsonl"
SENTINEL = "⟦TOKEN_USAGE⟧"
USAGE_KEYS = (
    "input_tokens",
    "output_tokens",
    "cache_read_tokens",
    "cache_write_tokens",
    "fresh_input_tokens",
    "total_tokens",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--format",
        choices=("footer", "json", "report"),
        default="report",
        help="report = 汇总 + 文末一次哨兵（默认）",
    )
    parser.add_argument("--last", type=int, default=20, help="How many recent turns to include")
    parser.add_argument("--workspace", type=Path, help="Filter by workspace root substring")
    parser.add_argument(
        "--self-check",
        action="store_true",
        help="Run a tiny format check and exit (no files required)",
    )
    return parser.parse_args()


def read_latest() -> dict[str, Any] | None:
    try:
        data = json.loads(LATEST_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def read_turns(limit: int) -> list[dict[str, Any]]:
    if not TURNS_PATH.exists():
        return []
    rows: list[dict[str, Any]] = []
    try:
        lines = TURNS_PATH.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    for line in reversed(lines):
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
        if len(rows) >= limit:
            break
    rows.reverse()
    return rows


def workspace_match(row: dict[str, Any], workspace: Path | None) -> bool:
    if workspace is None:
        return True
    needle = str(workspace.expanduser().resolve())
    roots = row.get("workspace_roots") or []
    return any(needle in str(root) or str(root) in needle for root in roots)


def totals_of(rows: list[dict[str, Any]]) -> dict[str, int]:
    totals = {key: 0 for key in USAGE_KEYS}
    for row in rows:
        usage = row.get("usage") or {}
        for key in totals:
            totals[key] += int(usage.get(key) or 0)
    return totals


def footer(row: dict[str, Any], label: str = "本轮") -> str:
    usage = row.get("usage") or {}
    model = row.get("model_id") or row.get("model") or "unknown"
    duration = row.get("duration_ms")
    duration_part = (
        f" · 耗时 {duration / 1000:.1f}s" if isinstance(duration, (int, float)) else ""
    )
    return (
        f"Token 用量（{label} parent agent）："
        f"总计 {int(usage.get('total_tokens') or 0):,}（"
        f"输入 {int(usage.get('input_tokens') or 0):,}，"
        f"其中缓存读 {int(usage.get('cache_read_tokens') or 0):,} / "
        f"缓存写 {int(usage.get('cache_write_tokens') or 0):,}；"
        f"未缓存 {int(usage.get('fresh_input_tokens') or 0):,}；"
        f"输出 {int(usage.get('output_tokens') or 0):,}）\n"
        f"模型：{model}{duration_part}"
    )


def summary_block(rows: list[dict[str, Any]]) -> str:
    totals = totals_of(rows)
    inp = totals["input_tokens"]
    hit = (totals["cache_read_tokens"] / inp) if inp else 0.0
    lines = [
        f"Token 用量汇总（最近 {len(rows)} 轮 parent agent）：",
        (
            f"总计 {totals['total_tokens']:,}（输入 {inp:,}，"
            f"其中缓存读 {totals['cache_read_tokens']:,} / "
            f"缓存写 {totals['cache_write_tokens']:,}；"
            f"未缓存 {totals['fresh_input_tokens']:,}；"
            f"输出 {totals['output_tokens']:,}）"
        ),
        f"缓存读占比：{hit:.1%}",
    ]
    if len(rows) > 1:
        lines.append("")
        for idx, row in enumerate(rows, start=1):
            ts = str(row.get("ts") or "")
            usage = row.get("usage") or {}
            lines.append(
                f"  {idx}. {ts}  总计 {int(usage.get('total_tokens') or 0):,}"
            )
    return "\n".join(lines)


def format_report(rows: list[dict[str, Any]]) -> str:
    # ponytail: sentinel once, after the whole summary; never per-turn followups
    body = summary_block(rows)
    latest = footer(rows[-1], label="最近一轮")
    return f"{body}\n\n{SENTINEL}\n{latest}"


def unavailable(message: str, output_format: str) -> int:
    if output_format == "json":
        print(json.dumps({"available": False, "error": message}, ensure_ascii=False))
    else:
        print(f"Token 用量：不可用（{message}）")
    return 2


def self_check() -> int:
    rows = [
        {
            "ts": "t1",
            "model": "m",
            "usage": {
                "input_tokens": 100,
                "output_tokens": 10,
                "cache_read_tokens": 40,
                "cache_write_tokens": 10,
                "fresh_input_tokens": 50,
                "total_tokens": 110,
            },
        },
        {
            "ts": "t2",
            "model": "m",
            "usage": {
                "input_tokens": 50,
                "output_tokens": 5,
                "cache_read_tokens": 0,
                "cache_write_tokens": 0,
                "fresh_input_tokens": 50,
                "total_tokens": 55,
            },
        },
    ]
    text = format_report(rows)
    assert SENTINEL in text, "missing sentinel"
    assert text.rfind(SENTINEL) == text.find(SENTINEL), "sentinel must appear once"
    assert text.index("Token 用量汇总") < text.index(SENTINEL), "summary before sentinel"
    assert text.strip().endswith("输出 5）\n模型：m") or "最近一轮" in text.split(SENTINEL, 1)[1]
    assert text.count(SENTINEL) == 1
    assert "最近 2 轮" in text
    assert "总计 165" in text
    print("self-check ok")
    return 0


def main() -> int:
    args = parse_args()
    if args.self_check:
        return self_check()

    rows = read_turns(max(1, args.last))
    if args.workspace is not None:
        rows = [row for row in rows if workspace_match(row, args.workspace)]
    if not rows:
        latest = read_latest()
        if latest and workspace_match(latest, args.workspace):
            rows = [latest]
    if not rows:
        return unavailable("尚未记录到 Cursor stop hook 用量；请确认 ~/.cursor/hooks.json 已加载", args.format)

    if args.format == "json":
        print(
            json.dumps(
                {
                    "available": True,
                    "turns": rows,
                    "totals": totals_of(rows),
                    "latest_path": str(LATEST_PATH),
                    "turns_path": str(TURNS_PATH),
                },
                ensure_ascii=False,
            )
        )
        return 0

    if args.format == "footer":
        print("\n\n".join(footer(row) for row in rows))
        return 0

    print(format_report(rows))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

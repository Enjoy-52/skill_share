#!/usr/bin/env python3
"""Emit a stub parallel plan JSON from a goal string (parent still must enforce isolation)."""
from __future__ import annotations

import argparse
import json
import re
import sys


def split_goal(goal: str) -> list[dict]:
    # Split on Chinese/English semicolons, commas used as task separators, or newlines
    parts = re.split(r"[；;\n]+|(?<=[。！？])\s*", goal.strip())
    parts = [p.strip(" 、,，") for p in parts if p and len(p.strip()) > 1]
    if len(parts) <= 1:
        # Keyword heuristics for common EnjoyDingDon-style bundles
        keywords = [
            ("支付|微信|MWEB|移动", "pay-mobile", ["**/frontend-portal-admin/**", "**/backend-service/src/wxpay.ts"]),
            ("权益|终生|宽限|调价|牌价", "entitlement", ["**/shared/**", "**/backend-service/**", "**/frontend-portal-admin/**"]),
            ("原生|iOS|Android|调研", "native-docs", ["docs/**", ".cursor/rules/**"]),
            ("部署|腾讯云|ECS|上线", "deploy", ["deploy/**"]),
        ]
        found = []
        for pat, sid, paths in keywords:
            if re.search(pat, goal, re.I):
                found.append(
                    {
                        "id": sid,
                        "goal": goal,
                        "write_globs": paths,
                        "note": "heuristic; parent must narrow write set to avoid overlap",
                    }
                )
        if found:
            return found
        return [
            {
                "id": "A",
                "goal": goal,
                "write_globs": [],
                "note": "single blob; parent should manually partition or run serial",
            }
        ]

    out = []
    for i, p in enumerate(parts):
        out.append(
            {
                "id": chr(ord("A") + i) if i < 26 else f"T{i}",
                "goal": p,
                "write_globs": [],
                "note": "fill write_globs before launching agents",
            }
        )
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--goal", required=True)
    ap.add_argument("--out", help="write JSON to file")
    args = ap.parse_args()
    plan = {
        "goal": args.goal,
        "max_agents": 4,
        "slices": split_goal(args.goal),
        "merge": ["path_audit", "typecheck", "user_summary_zh"],
    }
    text = json.dumps(plan, ensure_ascii=False, indent=2)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text + "\n")
    print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())

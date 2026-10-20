#!/usr/bin/env python3
"""Probe local hardware and recommend an auto R&D loop interval (seconds).

Stdout: one JSON object. Stderr: human summary. Exit 0 on success.
Stdlib only. Cross-platform: macOS / Linux / Windows.
"""

from __future__ import annotations

import json
import os
import platform
import subprocess
import sys


def cpu_count() -> int:
    n = os.cpu_count()
    return int(n) if n and n > 0 else 1


def mem_bytes() -> int | None:
    system = platform.system()
    try:
        if system == "Darwin":
            out = subprocess.check_output(["sysctl", "-n", "hw.memsize"], text=True).strip()
            return int(out)
        if system == "Linux":
            with open("/proc/meminfo", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("MemTotal:"):
                        # kB
                        return int(line.split()[1]) * 1024
        if system == "Windows":
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory"],
                text=True,
            ).strip()
            return int(out)
    except Exception:
        return None
    return None


def load1() -> float | None:
    try:
        if hasattr(os, "getloadavg"):
            return float(os.getloadavg()[0])
    except (OSError, AttributeError):
        pass
    if platform.system() == "Linux":
        try:
            with open("/proc/loadavg", encoding="utf-8") as f:
                return float(f.read().split()[0])
        except Exception:
            return None
    return None


def clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, n))


def recommend(cores: int, mem_b: int | None, load: float | None) -> dict:
    mem_gb = (mem_b / (1024**3)) if mem_b else None
    # Capacity score: more cores/RAM → shorter base interval (stronger box can tick more often).
    score = cores * 0.5 + (mem_gb or 8.0) * 0.25
    if score >= 20:
        base = 180  # 3m
    elif score >= 12:
        base = 300  # 5m
    elif score >= 6:
        base = 480  # 8m
    else:
        base = 720  # 12m

    load_ratio = None
    factor = 1.0
    if load is not None and cores > 0:
        load_ratio = load / cores
        if load_ratio >= 2.0:
            factor = 2.0
        elif load_ratio >= 1.0:
            factor = 1.5
        elif load_ratio >= 0.7:
            factor = 1.2

    seconds = clamp(int(round(base * factor)), 60, 1800)
    # Prefer round human units when close.
    for unit in (60, 120, 180, 300, 480, 600, 720, 900, 1200, 1800):
        if abs(seconds - unit) <= 30:
            seconds = unit
            break

    if seconds % 60 == 0:
        label = f"{seconds // 60}m"
    else:
        label = f"{seconds}s"

    return {
        "ok": True,
        "platform": platform.system(),
        "cores": cores,
        "mem_bytes": mem_b,
        "mem_gb": round(mem_gb, 1) if mem_gb is not None else None,
        "load1": round(load, 2) if load is not None else None,
        "load_ratio": round(load_ratio, 2) if load_ratio is not None else None,
        "capacity_score": round(score, 2),
        "load_factor": factor,
        "interval_seconds": seconds,
        "interval_label": label,
        "reason": (
            f"cores={cores}, mem_gb={mem_gb if mem_gb is not None else 'unknown'}, "
            f"load1={load if load is not None else 'n/a'} → base={base}s × {factor} = {seconds}s"
        ),
    }


def main() -> int:
    result = recommend(cpu_count(), mem_bytes(), load1())
    print(json.dumps(result, ensure_ascii=False))
    sys.stderr.write(
        f"[auto-rd-loop] interval={result['interval_label']} "
        f"({result['interval_seconds']}s) · {result['reason']}\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

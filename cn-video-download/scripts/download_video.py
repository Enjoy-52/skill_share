#!/usr/bin/env python3
"""
Unified downloader for Bilibili, Douyin, and WeChat Channels.
Designed as CLI today; core logic maps 1:1 to a future browser extension.

Usage:
  python download_video.py <url> -o /path/to/output.mp4
  python download_video.py <url> -d ./videos -n "自定义文件名"
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from platforms import bilibili, channels, douyin  # noqa: E402

SUPPORTED = ("bilibili", "douyin", "channels")


def detect_platform(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if "bilibili.com" in host or "b23.tv" in host:
        return "bilibili"
    if "douyin.com" in host or "iesdouyin.com" in host:
        return "douyin"
    if "channels.weixin.qq.com" in host or "weixin.qq.com" in host:
        return "channels"
    raise ValueError(f"Unsupported URL host: {host}. Supported: B站 / 抖音 / 视频号")


def resolve_output_path(url: str, out: str | None, out_dir: str | None, name: str | None) -> Path:
    if out:
        p = Path(out).expanduser().resolve()
        p.parent.mkdir(parents=True, exist_ok=True)
        return p
    directory = Path(out_dir or ".").expanduser().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    stem = name or _default_stem(url)
    stem = re.sub(r'[<>:"/\\|?*]', "_", stem).strip()
    return directory / f"{stem}.mp4"


def _default_stem(url: str) -> str:
    m = re.search(r"BV[\w]+", url)
    if m:
        return m.group(0)
    m = re.search(r"/video/(\d+)", url)
    if m:
        return m.group(1)
    return "video"


def main() -> int:
    parser = argparse.ArgumentParser(description="Download CN platform videos")
    parser.add_argument("url", help="Video page URL")
    parser.add_argument("-o", "--output", help="Full output file path (.mp4)")
    parser.add_argument("-d", "--dir", help="Output directory")
    parser.add_argument("-n", "--name", help="Output filename without extension")
    parser.add_argument(
        "--cookies-browser",
        default="chrome",
        help="Browser for cookie export (chrome|safari|firefox|edge)",
    )
    parser.add_argument("--no-cookies", action="store_true", help="Skip browser cookies")
    args = parser.parse_args()

    try:
        platform = detect_platform(args.url)
        output = resolve_output_path(args.url, args.output, args.dir, args.name)
        cookies_browser = None if args.no_cookies else args.cookies_browser

        handlers = {
            "bilibili": bilibili.download,
            "douyin": douyin.download,
            "channels": channels.download,
        }
        print(f"[{platform}] → {output}")
        handlers[platform](args.url, output, cookies_browser=cookies_browser)

        if not output.exists() or output.stat().st_size < 1024:
            print(f"ERROR: output missing or too small: {output}", file=sys.stderr)
            return 1
        print(f"OK: {output} ({output.stat().st_size} bytes)")
        return 0
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

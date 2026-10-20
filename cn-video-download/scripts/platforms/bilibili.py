"""Bilibili — yt-dlp primary."""
from __future__ import annotations

from pathlib import Path

from ._common import run_yt_dlp


def download(url: str, output: Path, *, cookies_browser: str | None = "chrome") -> None:
    # B站多数公开视频无需登录；1080P+ 需 --cookies-from-browser
    run_yt_dlp(url, output, cookies_browser=cookies_browser)

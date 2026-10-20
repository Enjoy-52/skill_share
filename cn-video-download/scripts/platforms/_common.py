"""Shared utilities for platform downloaders."""
from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path


def find_yt_dlp() -> str:
    candidates = [
        os.environ.get("YT_DLP"),
        shutil.which("yt-dlp"),
        "/opt/homebrew/bin/yt-dlp",
        "/usr/local/bin/yt-dlp",
        str(Path.home() / "Library/Python/3.9/bin/yt-dlp"),
        "/tmp/yt-dlp_macos",
    ]
    for path in candidates:
        if path and Path(path).is_file():
            return path
    raise FileNotFoundError(
        "yt-dlp not found. Install: brew install yt-dlp "
        "or pip3 install yt-dlp"
    )


def run_yt_dlp(
    url: str,
    output: Path,
    *,
    cookies_browser: str | None = "chrome",
    extra_args: list[str] | None = None,
) -> None:
    ytdlp = find_yt_dlp()
    cmd = [ytdlp]
    if cookies_browser:
        cmd.extend(["--cookies-from-browser", cookies_browser])
    cmd.extend([
        "-f", "bv*+ba/b",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "-o", str(output),
    ])
    if extra_args:
        cmd.extend(extra_args)
    cmd.append(url)
    subprocess.run(cmd, check=True)


def export_browser_cookies(browser: str = "chrome") -> Path:
    """Export Netscape cookies via yt-dlp for Playwright fallback."""
    ytdlp = find_yt_dlp()
    cookie_file = Path(tempfile.gettempdir()) / f"cn_video_{browser}_cookies.txt"
    subprocess.run(
        [
            ytdlp,
            "--cookies-from-browser",
            browser,
            "--cookies",
            str(cookie_file),
            "--skip-download",
            "https://www.douyin.com/",
        ],
        capture_output=True,
        check=False,
    )
    if not cookie_file.exists():
        raise RuntimeError(
            f"Could not export cookies from {browser}. "
            "Log in to the platform in that browser first."
        )
    return cookie_file

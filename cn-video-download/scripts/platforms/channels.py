"""WeChat Channels (视频号) — yt-dlp attempt, Playwright fallback."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

from ._common import export_browser_cookies, find_yt_dlp, run_yt_dlp


def download(url: str, output: Path, *, cookies_browser: str | None = "chrome") -> None:
    ytdlp = find_yt_dlp()
    # yt-dlp 可能随版本增加 Weixin 提取器；先试探
    probe = subprocess.run(
        [ytdlp, "--list-extractors"],
        capture_output=True,
        text=True,
    )
    if re.search(r"weixin|wechat.*channel", probe.stdout, re.I):
        run_yt_dlp(url, output, cookies_browser=cookies_browser)
        return

    if not cookies_browser:
        raise RuntimeError(
            "视频号需要浏览器 Cookie。请用微信 PC 端或浏览器登录 channels.weixin.qq.com"
        )

    cookie_file = export_browser_cookies(cookies_browser)
    _download_playwright(url, output, cookie_file)


def _download_playwright(url: str, output: Path, cookie_file: Path) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError(
            "Playwright required for 视频号. Run: pip3 install playwright"
        ) from exc

    import http.cookiejar

    cj = http.cookiejar.MozillaCookieJar(str(cookie_file))
    cj.load(ignore_discard=True, ignore_expires=True)
    cookies = [
        {
            "name": c.name,
            "value": c.value,
            "domain": c.domain,
            "path": c.path or "/",
            "secure": bool(c.secure),
            "httpOnly": False,
        }
        for c in cj
        if c.value and ("weixin" in (c.domain or "") or "qq.com" in (c.domain or ""))
    ]

    captured: list[str] = []

    def on_response(response):
        u = response.url
        ct = (response.headers.get("content-type") or "").lower()
        if ("video" in ct or u.endswith(".mp4")) and "qq.com" in u:
            if u not in captured and "preview" not in u.lower():
                captured.append(u)
        if "finder.video" in u or "findercdn" in u:
            if u not in captured:
                captured.append(u)

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
        )
        if cookies:
            context.add_cookies(cookies)
        page = context.new_page()
        page.on("response", on_response)
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(10000)
        try:
            page.locator("video").first.click(timeout=5000)
        except Exception:
            pass
        page.wait_for_timeout(5000)
        browser.close()

    if not captured:
        raise RuntimeError(
            "未捕获视频号流地址。请在 Chrome 登录视频号网页版后重试，"
            "或使用 reference.md 中的 wx_channels_download 方案。"
        )

    video_url = max(captured, key=len)
    subprocess.run(
        ["curl", "-L", "-b", str(cookie_file), "-o", str(output), video_url],
        check=True,
    )

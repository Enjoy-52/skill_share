"""Douyin — yt-dlp first, Playwright + Chrome fallback."""
from __future__ import annotations

import http.cookiejar
import re
import subprocess
from pathlib import Path

from ._common import export_browser_cookies, run_yt_dlp


def download(url: str, output: Path, *, cookies_browser: str | None = "chrome") -> None:
    if cookies_browser:
        try:
            run_yt_dlp(url, output, cookies_browser=cookies_browser)
            return
        except subprocess.CalledProcessError:
            print("[douyin] yt-dlp failed, falling back to Playwright…")

    cookie_file = export_browser_cookies(cookies_browser or "chrome")
    _download_playwright(url, output, cookie_file)


def _download_playwright(url: str, output: Path, cookie_file: Path) -> None:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        raise RuntimeError(
            "Playwright required for Douyin. Run: pip3 install playwright"
        ) from exc

    cookies = _load_cookies(cookie_file)
    captured: list[str] = []

    def on_response(response):
        u = response.url
        ct = (response.headers.get("content-type") or "").lower()
        if "douyinvod" in u and ".m3u8" not in u and u not in captured:
            captured.append(u)
        if re.search(r"aweme/v1/web/aweme/detail", u) and response.status == 200:
            try:
                body = response.json()
                video = (body.get("aweme_detail") or {}).get("video") or {}
                for key in ("play_addr", "download_addr"):
                    for item in (video.get(key) or {}).get("url_list") or []:
                        if item and item not in captured:
                            captured.append(item)
            except Exception:
                pass

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 720},
        )
        context.add_cookies(cookies)
        page = context.new_page()
        page.on("response", on_response)
        page.goto(url, wait_until="domcontentloaded", timeout=90000)
        page.wait_for_timeout(8000)
        try:
            page.locator("video").first.click(timeout=3000)
        except Exception:
            pass
        page.wait_for_timeout(5000)
        browser.close()

    if not captured:
        raise RuntimeError("No Douyin video URL captured. Refresh login in browser.")

    video_url = next(
        (u for u in captured if "douyinvod" in u and "playwm" not in u),
        captured[0],
    )
    subprocess.run(
        [
            "curl", "-L", "-b", str(cookie_file),
            "-A", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            "-o", str(output), video_url,
        ],
        check=True,
    )


def _load_cookies(cookie_file: Path) -> list[dict]:
    cj = http.cookiejar.MozillaCookieJar(str(cookie_file))
    cj.load(ignore_discard=True, ignore_expires=True)
    out = []
    for c in cj:
        if not c.value or "douyin" not in (c.domain or ""):
            continue
        out.append({
            "name": c.name,
            "value": c.value,
            "domain": c.domain,
            "path": c.path or "/",
            "secure": bool(c.secure),
            "httpOnly": False,
        })
    return out

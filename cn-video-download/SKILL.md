---
name: cn-video-download
description: >-
  Downloads videos from Bilibili (B站), Douyin (抖音), and WeChat Channels
  (微信视频号) to local MP4 files. Uses yt-dlp and Playwright fallbacks with
  browser cookies. Use when the user asks to download, save, or grab videos
  from bilibili.com, douyin.com, channels.weixin.qq.com, or mentions 视频号/B站/抖音
  download. Also use when planning a Chrome/browser extension for video download.
---

# 中文平台视频下载 (CN Video Download)

## 快速开始

用户提供 **URL + 保存路径/文件名** 时：

```bash
python ~/.cursor/skills/cn-video-download/scripts/download_video.py \
  "<url>" -d "/path/to/videos" -n "文件名不含扩展名"
```

或指定完整输出路径：

```bash
python ~/.cursor/skills/cn-video-download/scripts/download_video.py \
  "<url>" -o "/path/to/文件名.mp4"
```

**Agent 必须**：实际执行命令并验证输出文件存在且 `> 1KB`；失败时按下方决策树换方案。

## 依赖（首次使用前检查）

| 工具 | 用途 | 安装 |
|------|------|------|
| yt-dlp | B站主路径；抖音/视频号试探 | `brew install yt-dlp` 或 `pip3 install yt-dlp` |
| ffmpeg | 合并音视频 | `brew install ffmpeg` |
| playwright | 抖音/视频号回退 | `pip3 install -r scripts/requirements.txt` |
| Chrome | Playwright 复用已登录态 | 系统已装即可，无需单独下载 Chromium |

抖音/视频号：用户需在 **Chrome** 中登录对应平台。

## 平台策略

| 平台 | URL 特征 | 主方案 | 回退 |
|------|----------|--------|------|
| B站 | `bilibili.com`, `b23.tv` | yt-dlp | `--cookies-from-browser chrome` 提清晰度 |
| 抖音 | `douyin.com` | yt-dlp + cookies | Playwright 拦截 `douyinvod` |
| 视频号 | `channels.weixin.qq.com` | Playwright + cookies | 见 [reference.md](reference.md) 代理工具 |

## 决策树

```
识别 URL 平台
  ├─ B站 → yt-dlp（默认无需 cookie）
  ├─ 抖音 → yt-dlp + chrome cookies
  │         └─ 失败 / Fresh cookies → Playwright 回退
  └─ 视频号 → Playwright + chrome cookies
              └─ 失败 → 告知用户用微信 PC + 参考 reference.md
```

## 与用户协作时的默认约定

1. **文件名**：用户给的「」内文字为文件名（不含扩展名），非法字符替换为 `_`
2. **输出目录**：用户 `@` 的路径优先；未指定则询问或放在项目 `videos/`
3. **版权**：仅帮用户下载其有权的素材（课程备课、已获授权转载等）

## 源码位置（canonical，项目内）

实现已迁移至 **`WorkExperience/分享/2026.5 AI焦虑/tools/src/cn_video_download/`**。

```bash
cd "<项目>/tools"
PYTHONPATH=src python3 -m cn_video_download "<url>" -d "./videos" -n "文件名"
```

- 扩展骨架：`tools/extension/`
- 文档：`tools/docs/`

本目录 `scripts/` 为早期副本，请以项目 `tools/src` 为准。

## 常见问题

- **抖音 `Fresh cookies needed`**：先让用户在 Chrome 打开该视频页刷新，再重跑；仍失败走 Playwright
- **yt-dlp 过旧**：`pip3 install -U yt-dlp` 或从 [ghfast 镜像](https://ghfast.top/https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos) 下载二进制
- **Playwright 无 Chromium**：使用 `channel="chrome"`，勿依赖 `playwright install chromium`
- **视频号**：网页版 Cookie 不足时，推荐 [wx_channels_download](https://github.com/ltaoo/wx_channels_download)

## 延伸阅读

- 平台细节与排错：[reference.md](reference.md)
- 浏览器插件架构：[extension-roadmap.md](extension-roadmap.md)
- 命令示例：[examples.md](examples.md)

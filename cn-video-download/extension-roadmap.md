# 浏览器插件扩展路线图

目标：将 `scripts/platforms/*` 的解析逻辑复用到 Chrome / Edge / Firefox 扩展，在**浏览器内**完成下载（天然拥有 Cookie）。

## 架构分层

```
┌─────────────────────────────────────────────────────────┐
│  Extension UI (popup / content script badge)            │
│  - 当前页检测平台                                      │
│  - 自定义文件名、保存到默认目录（chrome.downloads）      │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  Service Worker (background)                            │
│  - routeByUrl(url) → bilibili | douyin | channels       │
│  - resolveStreamUrl(url) → { url, filename, headers }   │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   bilibili.ts     douyin.ts      channels.ts
   (port from      (port from      (port from
    bilibili.py)    douyin.py)      channels.py)
```

**与 CLI 的差异**

| 能力 | CLI (现) | 扩展 (规划) |
|------|----------|-------------|
| Cookie | `--cookies-from-browser` / 导出文件 | `chrome.cookies` API，零导出 |
| 下载 | curl / yt-dlp 子进程 | `chrome.downloads.download` 或 `fetch`+blob |
| 抖音 API | Playwright 无头 | **content script** 注入页面，读 `RENDER_DATA` / 拦截 `fetch` |
| 视频号 | Playwright | 微信网页版 tab + `webRequest` 监听 CDN |

## 建议仓库结构（未来）

```
cn-video-extension/
├── manifest.json          # MV3
├── background/
│   └── service-worker.ts
├── content/
│   ├── detector.ts        # 检测 BV / aweme_id / finder_id
│   └── intercept.ts       # 可选：hook fetch/XHR
├── lib/
│   ├── bilibili.ts        # 与 platforms/bilibili.py 同算法
│   ├── douyin.ts
│   └── channels.ts
├── popup/
│   └── popup.html + popup.ts
└── _shared/               # 从 skill scripts 同步（脚本生成或手拷）
```

## 平台实现要点

### B站
- Content script 读取页面 `window.__INITIAL_STATE__` 或调用现有公开接口
- 或 background 请求 B站 playurl API（需 wbi 签名，复杂度高）
- **务实方案 v1**：popup 调本地 Native Messaging 跑 yt-dlp（混合架构）

### 抖音
- `chrome.webRequest.onCompleted` 过滤 `*douyinvod*`
- 用户在抖音 tab 打开视频后，扩展显示「捕获到直链 → 下载」
- 与 CLI Playwright 拦截逻辑 **1:1 对应**

### 视频号
- 监听 `*findercdn*` / `finder.video*`
- 或对接 wx_channels_download 的本地 HTTP API（扩展只发下载指令）

## manifest.json 草稿 (MV3)

```json
{
  "manifest_version": 3,
  "name": "CN Video Download",
  "version": "0.1.0",
  "permissions": ["cookies", "downloads", "storage"],
  "host_permissions": [
    "*://*.bilibili.com/*",
    "*://*.douyin.com/*",
    "*://*.douyinvod.com/*",
    "*://channels.weixin.qq.com/*",
    "*://*.qq.com/*"
  ],
  "background": { "service_worker": "background/service-worker.js" },
  "action": { "default_popup": "popup/popup.html" },
  "content_scripts": [{
    "matches": [
      "*://www.bilibili.com/video/*",
      "*://www.douyin.com/video/*",
      "*://channels.weixin.qq.com/*"
    ],
    "js": ["content/detector.js"]
  }]
}
```

## 从 Skill 同步代码

维护约定：
1. **解析逻辑**以 `scripts/platforms/*.py` 为源（Python 可测）
2. 发插件前用同一组 fixture URL 做 golden test
3. 将 `resolve_stream_url` 的输入/输出 JSON schema 固定：

```json
{
  "input": { "pageUrl": "https://..." },
  "output": {
    "streamUrl": "https://...mp4",
    "filename": "标题.mp4",
    "headers": { "Referer": "..." }
  }
}
```

TypeScript 端口实现相同 schema，便于 CLI 与扩展共用测试向量。

## 分阶段交付

| 阶段 | 范围 | 价值 |
|------|------|------|
| M1 | 抖音 webRequest 捕获 + 下载 | 覆盖最高频失败场景 |
| M2 | B站（Native Host + yt-dlp 或纯前端 playurl） | 课件 B 站源 |
| M3 | 视频号 CDN 拦截 | 与微信生态对齐 |
| M4 | 统一 popup、批量队列、默认保存目录 | 产品化 |

## Native Messaging（可选）

若坚持 B站高画质 + 复杂签名，可提供小型本地 helper：
- 扩展 → `localhost:PORT/download?url=...`
- helper 内调用本 skill 的 `download_video.py`

这样插件 UI 先行，重型逻辑复用现有 skill，无需重写 B站签名。

# 平台参考与排错

## Bilibili (B站)

**URL 形式**
- 单集：`https://www.bilibili.com/video/BVxxxx`
- 短链：`https://b23.tv/xxxx`（yt-dlp 自动跳转）

**清晰度**
- 未登录：通常 480P/720P
- 1080P+：加 `--cookies-from-browser chrome`（需 B站大会员）

**验证**
```bash
ffprobe -v quiet -show_entries format=duration,size -of default=noprint_wrappers=1 output.mp4
```

## Douyin (抖音)

**反爬特点**
- Web API 常返回空 JSON，即使已导出 Cookie
- 直链域名含 `douyinvod.com`
- 带 `playwm` 的为带水印版本，优先选无 `playwm` 的 URL

**推荐流程**
1. `yt-dlp --cookies-from-browser chrome <url>`
2. 失败 → `platforms/douyin.py` Playwright 流程：
   - 导出 Cookie → 无头 Chrome 打开页面 → 监听网络 → `curl` 下载

**注意**：极短样本（<15s）需确认是否下到了完整页内视频而非占位素材。

## WeChat Channels (视频号)

**URL 形式**
- `https://channels.weixin.qq.com/platform/post/...`
- 或分享页 `https://channels.weixin.qq.com/...`

**现状（2026）**
- yt-dlp **尚无稳定** 的 `WeixinChannels` 提取器
- 网页版依赖微信登录态；Playwright 方案成功率取决于 Cookie 完整性

**备选工具（本机代理，适合后续插件对标）**

| 工具 | 原理 | 说明 |
|------|------|------|
| [wx_channels_download](https://github.com/ltaoo/wx_channels_download) | 微信 PC + 本地 MITM | 成熟，需安装证书 |
| [nobiyou/wx_channel](https://github.com/nobiyou/wx_channel) | 同上 + Web 控制台 | 支持批量 |

插件化时，视频号最适合 **在微信/浏览器内直接拿 Cookie + 拦截 CDN**，而非外部爬取。

## 工具路径（macOS）

按优先级查找 `yt-dlp`：
1. `$YT_DLP` 环境变量
2. `which yt-dlp`
3. `~/Library/Python/3.9/bin/yt-dlp`
4. `/opt/homebrew/bin/yt-dlp`

## 合法与合规

- 仅下载用户有权使用的素材
- 课程/内部分享需遵守平台 ToS
- 插件分发时避免批量爬取与绕过付费内容

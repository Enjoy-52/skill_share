# 使用示例

## B站

```bash
python ~/.cursor/skills/cn-video-download/scripts/download_video.py \
  "https://www.bilibili.com/video/BV1NE9DBSEsZ" \
  -d "./videos" -n "跨境电商卖家让AI全权托管，一夜损失百万"
```

## 抖音

```bash
# 先在 Chrome 登录 douyin.com 并打开目标视频页一次
python ~/.cursor/skills/cn-video-download/scripts/download_video.py \
  "https://www.douyin.com/video/7634743484917878070" \
  -d "./videos" -n "生产环境操控失误"
```

## 视频号

```bash
python ~/.cursor/skills/cn-video-download/scripts/download_video.py \
  "https://channels.weixin.qq.com/..." \
  -d "./videos" -n "案例标题"
```

## Agent 对话触发示例

用户说：
> 下载 https://www.bilibili.com/video/BVxxx 存到 @P1-.../videos，命名为「xxx」

Agent 应：
1. 读取本 skill
2. 执行 `download_video.py` 并 `-d` / `-n`
3. `ls -lh` + `ffprobe` 验证
4. 回报路径、时长、大小

## 环境变量

```bash
export YT_DLP=/path/to/yt-dlp_macos
```

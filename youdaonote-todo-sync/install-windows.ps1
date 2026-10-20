# youdaonote CLI — Windows 安装辅助（需已安装 Git 或 curl）
$ErrorActionPreference = "Stop"
Write-Host "==> 安装 youdaonote CLI（Windows）"
Write-Host "推荐：在 Git Bash 中运行官方 install.sh"
Write-Host "  curl -fsSL https://artifact.lx.netease.com/download/youdaonote-cli/install.sh | bash"
Write-Host ""
if (Get-Command curl -ErrorAction SilentlyContinue) {
  Write-Host "==> 尝试通过 curl 调用官方脚本..."
  curl.exe -fsSL https://artifact.lx.netease.com/download/youdaonote-cli/install.sh | bash
} else {
  Write-Host "未找到 curl，请安装 Git for Windows 后使用 Git Bash 执行上述命令。"
  exit 1
}
Write-Host "==> 完成后请执行: youdaonote check"
Write-Host "==> 配置 Key: youdaonote config set apiKey <KEY>"

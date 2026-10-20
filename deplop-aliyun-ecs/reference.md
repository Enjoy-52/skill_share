# 部署变量参考

## 配置文件优先级（后者覆盖前者）

1. `--env` / `ECS_DEPLOY_ENV` 显式指定
2. `ECS_SSH_ENV`（仅 SSH 指向；deploy 脚本原生支持）
3. `<项目>/config/local/dev-ssh.env`
4. `<项目>/deploy/config/aliyun-ecs/deploy-fudan-ilab.env`
5. `<项目>/config/local/deploy-fudan-ilab.env`
6. `~/.cursor/skills/deplop-aliyun-ecs/ecs.env`（全局默认）

## SSH 必填

| 变量 | 说明 |
|------|------|
| `ECS_HOST` | 公网 IP 或域名 |
| `ECS_KEY` | 私钥绝对路径 |
| `ECS_USER` | 默认 `root` |
| `ECS_PORT` | 默认 `22` |

## 部署可选

| 变量 | 默认 | 说明 |
|------|------|------|
| `DEPLOY_REMOTE_DIR` | `/opt/fudan-ilab` | 远程应用目录 |
| `DEPLOY_WEB_PORT` | `64200` | 看板 upstream |
| `DEPLOY_ADMIN_PORT` | `64201` | 管理后台 upstream |
| `DEPLOY_QMS_PORT` | `64202` | QMS H5 upstream |
| `DEPLOY_PUBLIC_PORT` | `60000` | HTTP 兼容端口 |
| `DEPLOY_QMS_PUBLIC_PORT` | `60001` | QMS HTTP 兼容 |
| `ADMIN_TOKEN` | `ilab-dev-token` | 管理 API 口令 |
| `DATABASE_URL` | — | Postgres（管理后台） |
| `SSL_CERT_DIR` | 项目 `config/ssl_cert/...` | 证书目录 |

## 部署模式

| 模式 | 作用 |
|------|------|
| `all` | 看板 + 管理 + QMS（默认） |
| `services` | 管理 + QMS，不更看板 |
| `admin` | 仅管理后台 |
| `qms` | 仅 QMS |
| `nginx` | 仅 SSL + Nginx |

## 项目约定

- 部署脚本：`deploy/deploy-ecs.sh`
- 服务器配置：`deploy/config/aliyun-ecs/`
- 真实密钥、私钥、生产 `.env` **不入库**；只用 `*.env.example`
- 临时构建：仓库根 `.deploy-stage/`（gitignore）

## OCR / 企微

`deploy-ecs.sh` 还会从以下文件读取 OCR 等运行时变量（若存在）：

- `src/backend-service/.env`
- `deploy/docker-compose.env`

部署到 Linux 时 `OCR_PROVIDER=local/vision/macos` 会自动改为 `baidu`。

---
name: deplop-aliyun-ecs
description: >-
  Deploys projects to Aliyun ECS via deploy/deploy-ecs.sh with SSH/env config
  import. Use when the user says 部署到阿里云 ECS、deplop-aliyun-ecs、deploy ecs、
  更新 ECS 地址、导入部署配置、deploy-fudan-ilab.env、dev-ssh.env, or asks to
  push builds to the remote server with new host/key/domain settings.
---

# deplop-aliyun-ecs · 部署到阿里云 ECS

简要指令：`deplop-aliyun-ecs`（名称保留用户约定拼写）。

读完本 Skill 后 **执行部署**，不要只列命令。默认走项目内 `deploy/deploy-ecs.sh`；配置支持 **新 ECS 信息导入** 或 **指定 `.env` 文件**。

Skill 路径：`~/.cursor/skills/deplop-aliyun-ecs/`（Windows：`%USERPROFILE%\.cursor\skills\deplop-aliyun-ecs\`）。

## 何时用本 Skill

- 用户说「部署到阿里云 ECS」「一键部署」「更新 ECS 地址」
- 用户提供新的 `ECS_HOST`、私钥路径、域名、端口
- 用户指定配置文件：`config/local/dev-ssh.env`、`deploy-fudan-ilab.env`、任意 `.env`
- 与 **本地 Docker Compose** 区分：本 Skill 只负责 **远程 ECS**；本地重建用 `docker-compose-package`

## 配置文件（三选一或组合）

| 方式 | 路径 / 用法 |
|------|-------------|
| 项目 SSH（推荐） | `config/local/dev-ssh.env`（从 `dev-ssh.env.example` 复制） |
| 项目部署变量 | `deploy/config/aliyun-ecs/deploy-fudan-ilab.env` |
| 全局默认 | `~/.cursor/skills/deplop-aliyun-ecs/ecs.env` |
| 显式指定 | `ECS_DEPLOY_ENV=/path/to.env` 或 `--env /path/to.env` |

合并规则见 [reference.md](reference.md)。**禁止**把真实密钥提交 git。

## Agent 工作流（必须执行）

### 1. 新 ECS / 新机器 — 导入配置

用户给出 IP、用户、端口、私钥路径时：

```bash
node ~/.cursor/skills/deplop-aliyun-ecs/scripts/init.mjs \
  --out config/local/dev-ssh.env \
  --host <ECS_HOST> \
  --user root \
  --port 22 \
  --key /absolute/path/to/key.pem
```

或手动编辑上述 `.env` / 用户指定的配置文件。域名、远程目录、端口等写入同一文件或 `deploy-fudan-ilab.env`。

### 2. 部署前检查

```bash
node ~/.cursor/skills/deplop-aliyun-ecs/scripts/check-config.mjs --root <项目根>
# 可选 SSH 探活：
node ~/.cursor/skills/deplop-aliyun-ecs/scripts/check-config.mjs --root <项目根> --ssh-test
```

指定配置文件：

```bash
node ~/.cursor/skills/deplop-aliyun-ecs/scripts/check-config.mjs \
  --env /path/to/custom.env
```

检查失败 → 修正配置后再部署，勿强行执行。

### 3. 执行部署

优先用 Skill 包装（自动合并 env 并调用 `deploy-ecs.sh`）：

```bash
node ~/.cursor/skills/deplop-aliyun-ecs/scripts/deploy.mjs [模式] [--env <文件>] [--root <项目根>]
```

| 模式 | 说明 |
|------|------|
| `all` | 全量：看板 + 管理 + QMS（默认） |
| `services` | 管理 + QMS，不更看板 |
| `admin` | 仅管理后台 |
| `qms` | 仅 QMS |
| `nginx` | 仅 SSL + Nginx |

等价直调（项目已有所需 env 时）：

```bash
ECS_SSH_ENV=config/local/dev-ssh.env bash deploy/deploy-ecs.sh [模式]
```

`block_until_ms` 给足（全量构建常需数分钟）。

### 4. 部署后汇报

向用户说明：

- 使用的配置文件路径
- 部署模式与目标 `ECS_USER@ECS_HOST`
- 探测结果（脚本末尾 `public_*` / `https` 状态码）
- 访问地址（从 `deploy/README.md` 或 `deploy/config/aliyun-ecs/README.md` 读取，勿编造）

## 用户指定 `.env` 时

1. 读取用户给出的路径（相对路径相对于项目根）
2. `check-config.mjs --env <路径>` 验证
3. `deploy.mjs --env <路径> [模式]`
4. 若文件仅含 `DATABASE_URL` / `ADMIN_TOKEN` 等而无 SSH 字段，与 `dev-ssh.env` **叠加**使用（勿覆盖已有 SSH 配置）

## 脚本一览

| 脚本 | 作用 |
|------|------|
| `scripts/init.mjs` | 生成/导入 SSH 配置 |
| `scripts/check-config.mjs` | 校验必填项与私钥 |
| `scripts/deploy.mjs` | 合并 env + 调用 `deploy-ecs.sh` |
| `ecs.env.example` | 全局/项目配置模板 |

## 项目内约定（iLab 等）

- 部署脚本与说明只在 `deploy/`，勿散落到 `doc/` / `src/`
- Nginx / PM2：`deploy/config/aliyun-ecs/`
- SSL：`config/ssl_cert/<域名>_nginx/`（不入库）
- OCR 密钥：`src/backend-service/.env`（部署时注入远程 PM2，不入库）

## 完成标准

- [ ] 配置已写入或已用用户指定 `.env`
- [ ] `check-config` 通过
- [ ] `deploy-ecs.sh` 已执行完毕
- [ ] 已汇报外网/HTTPS 探测结果与访问 URL

## 更多

完整变量表见 [reference.md](reference.md)。

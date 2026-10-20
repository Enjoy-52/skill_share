---
name: docker-compose-package
description: >-
  Rebuilds and redeploys local services via Docker Compose (--build / up -d).
  Use when the user says docker-compose-package, 在本地的docker-compose运行,
  重新打包到docker-compose中, 重新打包 compose, compose 重建/重启,
  docker compose rebuild, or asks to rebuild images and bring the local stack
  back up after code changes. Not for remote ECS deploy.
---

# docker-compose-package · 本地 Docker Compose 运行/重建

简要指令（任选其一即触发，读完后**立即执行**，不要只给口头命令）：

- `docker-compose-package`
- `在本地的docker-compose运行`
- `重新打包到docker-compose中`

## 目标

把当前工作区代码打进镜像并拉起**本机** Compose 栈（`build` + `up -d`）。  
与 ECS / 远程部署脚本区分：用户说「部署到阿里云 / 圣象 ECS」时改走对应 deploy skill/脚本，**不要**用本 skill。

## 定位 Compose（按优先级）

1. 用户显式给出的 compose 路径 / 服务名
2. 仓库内包装脚本（优先跑脚本，勿手搓重复逻辑）：
   - `deploy/compose-up.sh`（停止：`deploy/compose-down.sh`）
   - `compose-up.sh` / `scripts/compose-up.sh`
3. Compose 文件：
   - `deploy/docker-compose.yml`
   - 根目录 `docker-compose.yml` / `compose.yaml`
4. 仍找不到 → 简短问用户 compose 文件路径

若项目有 `deploy/` 约定：部署相关只动 `deploy/`，不要把 compose 散落到 `doc/` / `src/`。

### iLab 商赛仓库（默认）

```bash
bash deploy/compose-up.sh          # 全栈重建并后台启动
bash deploy/compose-up.sh <svc…>   # 只重建指定服务
bash deploy/compose-down.sh        # 停止
```

组名：`fudan-iLab-shengxiang`  
环境：无 `deploy/docker-compose.env` 时由脚本从 `docker-compose.env.example` 复制（不覆盖已有）。

| 服务 | 默认地址 |
|------|----------|
| 看板 | http://127.0.0.1:3000 |
| 管理端 | http://127.0.0.1:3001（`admin` / `admin123`） |
| QMS H5 | http://127.0.0.1:3002 |
| FastAPI | http://127.0.0.1:8000/healthz |
| Postgres | `127.0.0.1:5432` |

## 环境文件

- 若存在 `*.env.example` 且本地无对应 `.env` / `docker-compose.env`：先复制一份再 up（不覆盖已有本地 env）
- **禁止**把真实密钥、生产 `.env` 写入仓库

## 执行步骤

1. **确认工作区根**与 compose 文件 / 包装脚本路径。
2. **解析服务范围**：
   - 未指定 → 全栈重建
   - 指定服务名（如 `frontend-portal-admin`、`qms-api`、`qms-h5`）→ 只重建这些服务
3. **重建并启动**（有包装脚本优先）：

```bash
bash deploy/compose-up.sh [service...]

# 无包装脚本时
docker compose --env-file <env若有> -f <compose.yml> up -d --build [service...]
```

4. **核对结果**：
   - `docker compose … ps`（或 `docker ps` 过滤项目名）
   - 对已知健康检查 URL 探活（如 `/healthz`、管理端首页）；失败则读该服务最近日志并修到可启动或报告阻塞原因
5. **回复用户**：一句话说明重建了哪些服务 + 可访问地址（从脚本 echo / README / compose ports 读取，勿编造端口）

## 常用变体

| 用户说法 | 行为 |
|----------|------|
| 在本地的docker-compose运行 / 重新打包到docker-compose中 | 全栈 `up -d --build` |
| 只打包管理端 / 只重建 xxx | `up -d --build <service>` |
| 先停再起 | `compose-down`（若有）或 `docker compose down`，再本 skill 的 up |
| 不缓存重建 | 加 `--force-recreate`；需无缓存时对 build 加 `--no-cache`（仅用户明确要求时） |

## 注意

- 构建可能较久：`block_until_ms` 给足（常需数分钟）；勿中途假装成功
- 宿主机端口冲突：先说明，再按项目约定改 env 或征得同意后停冲突进程
- 小程序 / 非 Compose 组件：本 skill **不**打包；回复中一句带过
- 圣象/复旦 ECS 一键部署（`compose-deploy-shengxiang-ecs.sh` / `deploy-ecs.sh`）**不是**本 skill

## 完成标准

- [ ] 目标服务镜像已重新 build
- [ ] 容器处于 running（或 healthy）
- [ ] 已告知访问地址或失败原因

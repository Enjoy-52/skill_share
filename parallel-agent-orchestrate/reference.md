# Parallel Agent Orchestrate · Reference

## 子代理 Prompt 模板

```text
【并行切片 <ID>】相互不影响 — 严格隔离

仓库: <ABS_REPO_ROOT>
本切片目标: <ONE_SENTENCE>

可写路径白名单（仅允许改这些）:
- <path-or-glob-1>
- <path-or-glob-2>

禁止:
- 修改白名单以外的任何文件
- 打印 .env / 密钥 / 密码
- 扩大范围做「顺手重构」

完成定义:
- <bullet outcomes>

验证（在仓库内执行）:
- <e.g. cd src && npm run typecheck -w @dingdon/...>

返回格式（简体中文）:
1. 改动文件列表
2. 验证命令与结果
3. 风险 / 未做项
4. 是否需要 parent 接线
```

## 推荐切片模式（Web 单体 / monorepo）

| 切片 | 典型可写 | 勿碰 |
|------|----------|------|
| API/支付 | `**/backend-service/**` | frontend、docs |
| 家长端 UX | `**/frontend-portal-admin/**` | backend（除非只读契约） |
| 孩子端 UX | `**/frontend-client/**` | portal |
| 契约/shared | `**/shared/**` 独占一轮 | 其它包同时写 shared |
| 文档调研 | `docs/**`、可选 `.cursor/rules/**` | `src/**` |
| 部署 | `deploy/**` + 只读 config；或纯 shell 部署 | 业务逻辑大改 |

**shared 变更**：单独切片或并入 API 切片；不要与多个前端切片并行写 `shared`。

## 合并检查清单

- [ ] 各切片白名单无交集
- [ ] `EntitlementMe` / API 契约字段前后端一致
- [ ] 新路由已挂到 `index.ts`
- [ ] 前端 import 的 shared 已 build
- [ ] 部署与代码切片无争用同一临时文件
- [ ] 用户可见总结含失败切片与重试建议

## 失败重试

1. 只 `resume` 或新开失败切片  
2. Prompt 末尾贴上「上次失败原因」  
3. 成功后再跑父级总验证

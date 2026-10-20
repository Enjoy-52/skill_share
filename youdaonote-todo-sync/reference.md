# 数据约定

## pending-todos.json

```json
{
  "groupName": "MT-EnjoyAIAppTop",
  "source": "文档来源说明",
  "syncedAt": null,
  "todos": [
    {
      "id": "S-v1.1-A",
      "title": "[v1.1] 功能标题",
      "content": "验收标准 | 文档路径",
      "version": "v1.1",
      "priority": "P0"
    }
  ]
}
```

## map.json

本地 `id` ↔ 有道 `youdaoId` 映射，由 `push.mjs` 自动维护：

```json
{
  "groupName": "MT-EnjoyAIAppTop",
  "groupId": "有道分组ID",
  "items": {
    "S-v1.1-A": {
      "youdaoId": "...",
      "title": "...",
      "status": "open|done",
      "syncedAt": "ISO8601",
      "doneAt": "ISO8601"
    }
  }
}
```

## 环境变量

| 变量 | 默认 | 说明 |
|------|------|------|
| `YOUDAO_TODO_GROUP` | `MT-EnjoyAIAppTop` | 有道待办分组名 |

## 有道侧状态

- 新建待办默认为 **未完成**（App 中「进行中」）
- `done.mjs` 调用 `youdaonote todo update <id> --done`

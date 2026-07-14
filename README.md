# skill_share

共享 Cursor Agent Skills，供团队安装与复用。

## 已收录

| Skill | 说明 |
|-------|------|
| [crisp-prompt](./crisp-prompt/) | 将用户指令改写为 CRISP 六原则结构化提示词 |

## 安装

将对应目录复制到本机 Cursor skills 目录。

### macOS / Linux

```bash
# 全局 skills（所有项目可用）
cp -R crisp-prompt ~/.cursor/skills/

# 或项目内 skills
cp -R crisp-prompt /path/to/project/.cursor/skills/
```

### Windows（PowerShell）

```powershell
# 全局 skills（所有项目可用）
Copy-Item -Recurse crisp-prompt $env:USERPROFILE\.cursor\skills\

# 或项目内 skills
Copy-Item -Recurse crisp-prompt path\to\project\.cursor\skills\
```

若 `.cursor\skills` 目录尚不存在，先创建：

```powershell
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.cursor\skills
```

也可在本仓库中直接浏览 `SKILL.md` 后按需同步。

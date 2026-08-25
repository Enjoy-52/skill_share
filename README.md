# skill_share

共享 Cursor Agent Skills，供团队安装与复用。

## 已收录

| Skill | 说明 |
|-------|------|
| [compressed-pdf](./compressed-pdf/) | 将 PDF 压缩到指定体积上限（默认 4.2MB），保留原文件 |
| [crisp-prompt](./crisp-prompt/) | 将用户指令改写为 CRISP 六原则结构化提示词 |
| [project-analysis](./project-analysis/) | 分析陌生、大型或复杂仓库的架构、入口、风险与下一步 |
| [release-milestone](./release-milestone/) | 里程碑完成后提交、打 tag、创建 `releases/v{version}` 分支 |
| [summary-daily-work](./summary-daily-work/) | 按六段模板输出可复制的今日工作日报 |
| [summary-daily-work-hl-tender](./summary-daily-work-hl-tender/) | 为 hl-tender 生成六段式日报并写入绩效日报目录 |
| [summary-work](./summary-work/) | 将当前进展整理为五段式工作总结 |

## 安装

将对应目录复制到本机 Cursor skills 目录。把下面的 `<skill-name>` 换成上表中的目录名。

### macOS / Linux

```bash
# 全局 skills（所有项目可用）
cp -R <skill-name> ~/.cursor/skills/

# 或项目内 skills
cp -R <skill-name> /path/to/project/.cursor/skills/
```

一次性安装全部：

```bash
for d in compressed-pdf crisp-prompt project-analysis release-milestone summary-daily-work summary-daily-work-hl-tender summary-work; do
  cp -R "$d" ~/.cursor/skills/
done
```

### Windows（PowerShell）

```powershell
# 全局 skills（所有项目可用）
Copy-Item -Recurse <skill-name> $env:USERPROFILE\.cursor\skills\

# 或项目内 skills
Copy-Item -Recurse <skill-name> path\to\project\.cursor\skills\
```

一次性安装全部：

```powershell
$skills = @(
  'compressed-pdf',
  'crisp-prompt',
  'project-analysis',
  'release-milestone',
  'summary-daily-work',
  'summary-daily-work-hl-tender',
  'summary-work'
)
foreach ($s in $skills) {
  Copy-Item -Recurse $s $env:USERPROFILE\.cursor\skills\
}
```

若 `.cursor\skills` 目录尚不存在，先创建：

```powershell
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.cursor\skills
```

也可在本仓库中直接浏览 `SKILL.md` 后按需同步。

---
name: csdn-tech-blog
description: >-
  Renders CSDN/tech blog articles with standardized footer (contact, CC license,
  update log, series navigation). Loads author config from ~/.config/millennium-tech/blog-author.env
  and project config from config/local/blog.env or csdn.env. Use when writing CSDN articles,
  blog series, technical posts, 博客模板, 系列文章, or generating doc/06-宣传 markdown/PDF.
---

# CSDN 技术博客模板（全局 Skill）

跨项目复用的 **CSDN / 技术博客文章模板**：统一页脚（联系方式、版权声明、更新记录、系列导航），正文由 Agent 按项目内容撰写。

Skill 路径：`~/.cursor/skills/csdn-tech-blog/`  
Windows：`%USERPROFILE%\.cursor\skills\csdn-tech-blog\`

## 配置分层（重要）

| 层级 | 文件 | 内容 | 复用范围 |
|------|------|------|----------|
| **博主全局** | `~/.config/millennium-tech/blog-author.env` | 姓名、职称、邮箱、CSDN 主页 | 所有项目 |
| **项目级** | `config/local/blog.env` 或 `csdn.env` | 系列名、GitHub、交流群、标签 | 当前仓库 |

**不要**把密码/Cookie 放进博客模板配置；`CSDN_PASSWORD` 等仍仅用于本机发布脚本。

### 一次性：博主全局配置

```bash
mkdir -p ~/.config/millennium-tech
cp ~/.cursor/skills/csdn-tech-blog/author.env.example \
   ~/.config/millennium-tech/blog-author.env
# 编辑：BLOG_AUTHOR_NAME、BLOG_CONTACT_EMAIL、BLOG_AUTHOR_CSDN_USERNAME
```

### 每个项目：blog.env（推荐）或扩展 csdn.env

```bash
cp config/local/blog.env.example config/local/blog.env
# 或沿用已有 config/local/csdn.env，补充 BLOG_* 字段
```

## Agent 写文工作流

1. **读配置**（不读密码字段）：
   ```bash
   node ~/.cursor/skills/csdn-tech-blog/scripts/load-blog-config.mjs --root .
   ```
2. **写正文**（`doc/06-宣传/` 或 `BLOG_OUTPUT_DIR`），技术深度按用户要求。
3. **渲染完整文章**（自动拼接页脚）：
   ```bash
   node ~/.cursor/skills/csdn-tech-blog/scripts/render-article.mjs \
     --root . \
     --title "文章标题" \
     --summary "120字以内摘要" \
     --part 1 \
     --tags "Electron,SSH,TypeScript" \
     --audience "Electron 开发者" \
     --body-file doc/06-宣传/_draft-body.md \
     --out doc/06-宣传/CSDN-文章-slug.md
   ```
4. **可选 PDF**（EnjoyTerm 等项目）：
   ```bash
   node --input-type=module -e "
   import { writePdfFromMd } from './scripts/autopilot/report-pdf.mjs';
   writePdfFromMd('doc/06-宣传/xxx.md', 'doc/06-宣传/xxx.pdf');
   "
   ```
5. 交付时告知用户：Markdown 路径、CSDN 发布字段（标题/摘要/标签）、**勿提交** `config/local/*.env`。

## 作者信息 + 页脚模板（verbatim）

Agent 渲染后的文末 **必须** 包含以下结构（占位符由脚本填充）：

```markdown
**关于作者**

CodeCaptain/刘晔瑛，能源物联网产品公司技术副总/自由游戏全栈开发者。

技术特点：极客+极致用户体验师，技术布道师。

邮箱：code_captain@163.com | cavan.liu@mt-soft.com

EnjoyTerm技术交流群：

GitHub：https://github.com/Enjoy-52

**版权声明**

本文为原创内容，转载请注明出处：[文章链接]

---

## 如何联系我

- **评论区留言**（推荐，便于其他读者共同学习）；
- **CSDN 博客**：[CodeCaptain](https://blog.csdn.net/mimica247706624)；
- **系列文章导航**：[系列名](系列链接)

---

**更新记录**：
- 首次发布：2026-04-13
- 最后修改：2026-04-17
```

发布到 CSDN 后，用 `--article-url` 传入真实链接再跑 `refresh-article-footers.mjs`。

## 文章 shell 结构

见 [templates/article-shell.md](templates/article-shell.md)：

- YAML frontmatter（title / author / tags / summary / series）
- 标题下引用块（作者、系列序号、读者、摘要）
- 正文 `{{BODY}}`
- 标准页脚 `{{FOOTER}}`

## 系列文章规范

- 专栏/系列名写入 `BLOG_SERIES_TITLE`；目录 URL 写入 `BLOG_SERIES_INDEX_URL`（CSDN 专栏链接或自建索引 md）。
- 标题建议：`{系列名} (03/10)：具体技术点`。
- 每篇 `--part N`，文末系列导航指向同一 `BLOG_SERIES_INDEX_URL`。
- 首篇发布后更新系列索引 md，把「链接待补充」换成真实 URL。

## 配置字段速查

### 博主全局 `blog-author.env`

| 变量 | 说明 |
|------|------|
| `BLOG_AUTHOR_NAME` | 笔名（CodeCaptain） |
| `BLOG_AUTHOR_REAL_NAME` | 真实姓名 |
| `BLOG_AUTHOR_TITLE` | 职称/定位 |
| `BLOG_AUTHOR_TRAITS` | 技术特点 |
| `BLOG_CONTACT_EMAIL` / `BLOG_CONTACT_EMAIL_ALT` | 联系邮箱 |
| `BLOG_CSDN_HOME_URL` | CSDN 博客主页 |

### 项目 `blog.env` / `csdn.env`

| 变量 | 说明 |
|------|------|
| `BLOG_PROJECT_NAME` | 产品名 |
| `BLOG_COMMUNITY_NAME` / `BLOG_COMMUNITY_URL` | 交流群名称与链接 |
| `BLOG_PROJECT_GITHUB` | 项目 GitHub |
| `BLOG_SERIES_TITLE` / `BLOG_SERIES_INDEX_URL` | 系列名与目录 |
| `BLOG_DEFAULT_TAGS` / `BLOG_OUTPUT_DIR` | 标签与输出目录 |
| `CSDN_USERNAME` | CSDN 用户名（可选） |

## 脚本一览

| 脚本 | 作用 |
|------|------|
| `scripts/load-blog-config.mjs` | 合并全局 + 项目配置，输出 JSON |
| `scripts/render-footer.mjs` | 仅渲染页脚 |
| `scripts/render-article.mjs` | 正文 + shell + 页脚 → 完整 md |
| `scripts/refresh-article-footers.mjs` | 批量更新已有 md 的标准页脚 |

## 安全

- 不读取、不回显 `CSDN_PASSWORD`、`CSDN_COOKIE`、`CSDN_OAUTH_TOKEN`。
- `config/local/*.env` 已在项目 `.cursorignore` 中；Agent 只用 `load-blog-config.mjs` 读公开字段。

## 延伸阅读

- 模板文件：[templates/](templates/)
- 示例配置：[author.env.example](author.env.example)

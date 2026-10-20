#!/usr/bin/env node
/**
 * 渲染文章页脚（作者信息 + 联系方式 + 更新记录）
 *
 * node render-footer.mjs
 * node render-footer.mjs --published 2026-04-13 --article-url https://blog.csdn.net/...
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadBlogConfig } from './load-blog-config.mjs'

const skillRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function today () {
  return new Date().toISOString().slice(0, 10)
}

function fillTemplate (text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

function parseArgs () {
  const args = process.argv.slice(2)
  const out = {
    root: '',
    published: today(),
    updated: today(),
    seriesTitle: '',
    seriesIndexUrl: '',
    articleUrl: '[文章链接]',
    out: ''
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') out.root = args[++i] ?? ''
    else if (a === '--published') out.published = args[++i] ?? out.published
    else if (a === '--updated') out.updated = args[++i] ?? out.updated
    else if (a === '--series-title') out.seriesTitle = args[++i] ?? ''
    else if (a === '--series-index') out.seriesIndexUrl = args[++i] ?? ''
    else if (a === '--article-url') out.articleUrl = args[++i] ?? out.articleUrl
    else if (a === '--out') out.out = args[++i] ?? ''
  }
  return out
}

export function renderArticleFooter (cli = {}) {
  const cfg = loadBlogConfig({ root: cli.root || undefined })
  const vars = {
    AUTHOR_LINE: cfg.authorLine,
    AUTHOR_TITLE: cfg.authorTitle,
    AUTHOR_TRAITS: cfg.authorTraits,
    CONTACT_EMAIL: cfg.contactEmail,
    CONTACT_EMAIL_ALT: cfg.contactEmailAlt,
    COMMUNITY_LINE: cfg.communityLine,
    PROJECT_GITHUB: cfg.projectGithub,
    ARTICLE_URL: cli.articleUrl || '[文章链接]',
    AUTHOR_NAME: cfg.authorName,
    CSDN_BLOG_URL: cfg.csdnBlogUrl,
    SERIES_TITLE: cli.seriesTitle || cfg.seriesTitle,
    SERIES_INDEX_URL: cli.seriesIndexUrl || cfg.seriesIndexUrl,
    PUBLISHED_DATE: cli.published || today(),
    UPDATED_DATE: cli.updated || today()
  }

  const authorTpl = fs.readFileSync(path.join(skillRoot, 'templates', 'article-author.md'), 'utf8')
  const footerTpl = fs.readFileSync(path.join(skillRoot, 'templates', 'article-footer.md'), 'utf8')
  return `${fillTemplate(authorTpl, vars).trim()}\n\n${fillTemplate(footerTpl, vars).trim()}`
}

function main () {
  const cli = parseArgs()
  const footer = renderArticleFooter(cli)

  if (cli.out) {
    fs.mkdirSync(path.dirname(cli.out), { recursive: true })
    fs.writeFileSync(cli.out, footer, 'utf8')
    console.log(`[blog] 页脚已写入 ${cli.out}`)
  } else {
    process.stdout.write(footer)
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main()
}

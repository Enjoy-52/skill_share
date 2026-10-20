#!/usr/bin/env node
/**
 * 将正文 Markdown 包裹为完整 CSDN 文章（含 frontmatter + 页脚）
 *
 * node render-article.mjs \
 *   --title "文章标题" \
 *   --summary "摘要" \
 *   --body-file article-body.md \
 *   --out doc/06-宣传/my-article.md \
 *   --part 1 \
 *   --tags "Electron,SSH"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadBlogConfig } from './load-blog-config.mjs'
import { execFileSync } from 'node:child_process'

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
    title: '',
    summary: '',
    audience: '',
    tags: '',
    part: '1',
    bodyFile: '',
    body: '',
    outFile: '',
    published: today(),
    updated: today(),
    seriesTitle: '',
    seriesIndexUrl: ''
  }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') out.root = args[++i] ?? ''
    else if (a === '--title') out.title = args[++i] ?? ''
    else if (a === '--summary') out.summary = args[++i] ?? ''
    else if (a === '--audience') out.audience = args[++i] ?? ''
    else if (a === '--tags') out.tags = args[++i] ?? ''
    else if (a === '--part') out.part = args[++i] ?? '1'
    else if (a === '--body-file') out.bodyFile = args[++i] ?? ''
    else if (a === '--body') out.body = args[++i] ?? ''
    else if (a === '--out') out.outFile = args[++i] ?? ''
    else if (a === '--published') out.published = args[++i] ?? out.published
    else if (a === '--updated') out.updated = args[++i] ?? out.updated
    else if (a === '--series-title') out.seriesTitle = args[++i] ?? ''
    else if (a === '--series-index') out.seriesIndexUrl = args[++i] ?? ''
  }
  return out
}

function renderFooter (cli, cfg) {
  const renderFooterScript = path.join(skillRoot, 'scripts', 'render-footer.mjs')
  const args = [
    renderFooterScript,
    '--root', cli.root || cfg.repoRoot,
    '--published', cli.published,
    '--updated', cli.updated
  ]
  if (cli.seriesTitle) args.push('--series-title', cli.seriesTitle)
  if (cli.seriesIndexUrl) args.push('--series-index', cli.seriesIndexUrl)
  return execFileSync(process.execPath, args, { encoding: 'utf8' })
}

function main () {
  const cli = parseArgs()
  if (!cli.title) {
    console.error('[blog] 缺少 --title')
    process.exit(1)
  }
  if (!cli.outFile) {
    console.error('[blog] 缺少 --out')
    process.exit(1)
  }

  const cfg = loadBlogConfig({ root: cli.root || undefined })
  const body = cli.bodyFile
    ? fs.readFileSync(cli.bodyFile, 'utf8').trim()
    : cli.body.trim()

  if (!body) {
    console.error('[blog] 缺少正文：--body-file 或 --body')
    process.exit(1)
  }

  const footer = renderFooter(cli, cfg)
  const shellPath = path.join(skillRoot, 'templates', 'article-shell.md')
  const vars = {
    TITLE: cli.title,
    AUTHOR_DISPLAY: cfg.authorDisplay,
    TAGS: cli.tags || cfg.defaultTags,
    SUMMARY: cli.summary,
    SERIES_TITLE: cli.seriesTitle || cfg.seriesTitle,
    SERIES_INDEX_URL: cli.seriesIndexUrl || cfg.seriesIndexUrl,
    PUBLISHED_DATE: cli.published,
    UPDATED_DATE: cli.updated,
    SERIES_PART: cli.part,
    AUDIENCE: cli.audience || cfg.defaultAudience,
    BODY: body,
    FOOTER: footer.trim()
  }

  const article = fillTemplate(fs.readFileSync(shellPath, 'utf8'), vars)
  fs.mkdirSync(path.dirname(path.resolve(cli.outFile)), { recursive: true })
  fs.writeFileSync(cli.outFile, article, 'utf8')
  console.log(`[blog] 文章已写入 ${cli.outFile}`)
}

main()

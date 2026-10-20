#!/usr/bin/env node
/**
 * 替换 Markdown 文章中的标准页脚（作者信息 + 联系方式 + 更新记录）
 */
import fs from 'node:fs'
import path from 'node:path'
import { renderArticleFooter } from './render-footer.mjs'

function parseArgs () {
  const args = process.argv.slice(2)
  const out = { root: '', published: '', updated: '', articleUrl: '', files: [] }
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--root') out.root = args[++i] ?? ''
    else if (a === '--published') out.published = args[++i] ?? ''
    else if (a === '--updated') out.updated = args[++i] ?? ''
    else if (a === '--article-url') out.articleUrl = args[++i] ?? ''
    else out.files.push(a)
  }
  return out
}

function findFooterStart (content) {
  const markers = ['\n**关于作者**', '\n---\n\n## 如何联系我', '\n## 如何联系我']
  let idx = -1
  for (const marker of markers) {
    const pos = content.indexOf(marker)
    if (pos !== -1 && (idx === -1 || pos < idx)) idx = pos
  }
  return idx
}

function replaceFooter (content, footer) {
  const idx = findFooterStart(content)
  if (idx === -1) throw new Error('未找到页脚起始标记（**关于作者** 或 ## 如何联系我）')
  const head = content.slice(0, idx).trimEnd()
  return `${head}\n\n${footer}\n`
}

function main () {
  const cli = parseArgs()
  if (!cli.files.length) {
    console.error('用法: refresh-article-footers.mjs [--root .] article.md ...')
    process.exit(1)
  }
  const footer = renderArticleFooter(cli)
  for (const file of cli.files) {
    const abs = path.resolve(file)
    const next = replaceFooter(fs.readFileSync(abs, 'utf8'), footer)
    fs.writeFileSync(abs, next, 'utf8')
    console.log('[blog] 页脚已更新', abs)
  }
}

main()

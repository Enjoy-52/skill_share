#!/usr/bin/env node
/**
 * 合并博主全局配置 + 项目 blog.env / csdn.env
 * 用法：node load-blog-config.mjs [--root /path/to/repo]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const skillRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseEnvFile (filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function homeConfigPath () {
  const home = process.env.HOME || process.env.USERPROFILE || ''
  return path.join(home, '.config', 'millennium-tech', 'blog-author.env')
}

function findRepoRoot (start) {
  let dir = path.resolve(start)
  for (let i = 0; i < 8; i++) {
    if (
      fs.existsSync(path.join(dir, 'config', 'local')) ||
      fs.existsSync(path.join(dir, '.git'))
    ) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(start)
}

function projectEnvCandidates (repoRoot) {
  return [
    path.join(repoRoot, 'config', 'local', 'blog.env'),
    path.join(repoRoot, 'config', 'local', 'csdn.env')
  ]
}

export function loadBlogConfig (options = {}) {
  const repoRoot = options.root
    ? path.resolve(options.root)
    : findRepoRoot(process.cwd())

  const layers = [
    parseEnvFile(homeConfigPath()),
    ...projectEnvCandidates(repoRoot).map(parseEnvFile)
  ]

  const merged = {}
  for (const layer of layers) {
    Object.assign(merged, layer)
  }

  const authorName = merged.BLOG_AUTHOR_NAME || 'CodeCaptain'
  const authorRealName = merged.BLOG_AUTHOR_REAL_NAME || ''
  const authorTitle = merged.BLOG_AUTHOR_TITLE || ''
  const authorTraits = merged.BLOG_AUTHOR_TRAITS || ''
  const authorLine = authorRealName
    ? `${authorName}/${authorRealName}`
    : authorName
  const csdnUsername = merged.BLOG_AUTHOR_CSDN_USERNAME || merged.CSDN_USERNAME || ''
  const authorDisplay = csdnUsername
    ? `${authorName}（CSDN：${csdnUsername}）`
    : authorName
  const contactEmailAlt = merged.BLOG_CONTACT_EMAIL_ALT || merged.CONTACT_EMAIL_ALT || ''
  const communityName = merged.BLOG_COMMUNITY_NAME || ''
  const communityUrl = merged.BLOG_COMMUNITY_URL || ''
  let communityLine = ''
  if (communityName) {
    communityLine = communityUrl
      ? `${communityName}：${communityUrl}\n\n`
      : `${communityName}：\n\n`
  }
  const projectGithub = merged.BLOG_PROJECT_GITHUB || merged.GITHUB_URL || ''

  const csdnBlogUrl =
    merged.BLOG_CSDN_HOME_URL ||
    merged.CSDN_BLOG_URL ||
    merged.CSDN_BLOG_HOME_URL ||
    ''

  return {
    repoRoot,
    authorName,
    authorRealName,
    authorLine,
    authorTitle,
    authorTraits,
    csdnUsername,
    authorDisplay,
    contactEmailAlt,
    communityName,
    communityUrl,
    communityLine,
    projectGithub,
    csdnBlogUrl,
    contactEmail: merged.BLOG_CONTACT_EMAIL || merged.CONTACT_EMAIL || 'code_captain@163.com',
    licenseName: merged.BLOG_LICENSE_NAME || 'CC 4.0 BY-SA',
    licenseUrl: merged.BLOG_LICENSE_URL || 'http://creativecommons.org/licenses/by-sa/4.0/',
    seriesTitle: merged.BLOG_SERIES_TITLE || merged.CSDN_COLUMN || '系列文章',
    seriesIndexUrl:
      merged.BLOG_SERIES_INDEX_URL ||
      merged.CSDN_SERIES_INDEX_URL ||
      csdnBlogUrl ||
      '链接待补充',
    projectName: merged.BLOG_PROJECT_NAME || path.basename(repoRoot),
    defaultTags: merged.BLOG_DEFAULT_TAGS || merged.CSDN_DEFAULT_TAGS || '',
    defaultAudience: merged.BLOG_DEFAULT_AUDIENCE || '开发者',
    outputDir: merged.BLOG_OUTPUT_DIR || path.join(repoRoot, 'doc', '06-宣传'),
    raw: merged
  }
}

function parseArgs () {
  const args = process.argv.slice(2)
  let root = ''
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--root') root = args[++i] ?? ''
  }
  return { root }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const { root } = parseArgs()
  console.log(JSON.stringify(loadBlogConfig({ root }), null, 2))
}

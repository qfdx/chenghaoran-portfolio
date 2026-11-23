// 远程访问验收脚本
// 用法：
//   公开模式：node scripts/check_access.mjs <url>
//   认证模式：node scripts/check_access.mjs <url> <user> <pass>
// 公开模式判据：首页 200 + 敏感路径全 404（公开 ≠ 泄露源码与配置）
// 认证模式判据：无凭据/错密码 401，正确凭据 200，敏感路径全 404
const url = process.argv[2]
const user = process.argv[3] || ''
const pass = process.argv[4] || ''
const authMode = Boolean(user && pass)

if (!url) {
  console.error('用法: node scripts/check_access.mjs <url> [user] [pass]')
  process.exit(1)
}

const basic = Buffer.from(`${user}:${pass}`).toString('base64')

const probe = async (label, headers, targetPath = '') => {
  const res = await fetch(new URL(targetPath, url).href, { headers, redirect: 'manual' })
  const text = await res.text()
  return {
    label,
    status: res.status,
    ctype: res.headers.get('content-type') || '',
    authHeader: res.headers.get('www-authenticate') || '',
    bytes: text.length,
  }
}

const results = []
if (authMode) {
  results.push(await probe('① 无凭据（应 401）', {}))
  results.push(await probe('② 错误密码（应 401）', { Authorization: `Basic ${Buffer.from(`${user}:wrong-password`).toString('base64')}` }))
  results.push(await probe('③ 正确凭据（应 200）', { Authorization: `Basic ${basic}` }))
} else {
  results.push(await probe('① 匿名访问首页（应 200，公开模式）', {}))
}

const creds = authMode ? { Authorization: `Basic ${basic}` } : {}
results.push(await probe('② 静态资源目录 /assets/（应 404，不列目录）', creds, '/assets/'))

for (const p of ['/.env', '/@fs/E:/个人知识库/个人网站/package.json', '/src/main.jsx', '/../package.json', '/.git/config']) {
  results.push(await probe(`③ 敏感路径 ${p}（应 404）`, creds, p))
}

console.log('目标:', url, '｜ 模式:', authMode ? '认证' : '公开')
console.log('--------------------------------------------------')
for (const r of results) {
  console.log(`${r.label.padEnd(46)} → HTTP ${r.status}${r.authHeader ? '  WWW-Authenticate: ' + r.authHeader : ''}`)
}
console.log('--------------------------------------------------')

const sensitive = results.slice(authMode ? 3 : 1)
const sensitiveOk = sensitive.every((r) => r.status === 404)
let ok
if (authMode) {
  ok = results[0].status === 401 && results[1].status === 401 && results[2].status === 200 && sensitiveOk
} else {
  ok = results[0].status === 200 && sensitiveOk
}
console.log(ok ? '✅ 验收通过：公开可访问，且未泄露源码/配置/目录' : '❌ 验收未通过')
process.exit(ok ? 0 : 1)

// 生产静态服务（加固版）——只服务 dist/ 构建产物
// 设计要点：
//  1. 只绑定 127.0.0.1，外部访问必须经由隧道进来（隧道是唯一入口）
//  2. 访问控制可选：默认公开（个人作品集给老师看）；设置 AUTH_USER + AUTH_PASS 即开启 Basic Auth
//  3. 始终拦截：隐藏文件（.env/.git）、目录穿越、目录列表 —— 公开也不泄露这些东西
//  4. 安全响应头（CSP / nosniff / X-Frame-Options 等）
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', 'dist')

const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || 4173)
// 不传 AUTH_USER/AUTH_PASS = 公开访问（作品集场景）；都传 = 开启 Basic Auth
const AUTH_USER = process.env.AUTH_USER || ''
const AUTH_PASS = process.env.AUTH_PASS || ''
const AUTH_ON = Boolean(AUTH_USER && AUTH_PASS)
const MAX_FAIL = Number(process.env.MAX_FAIL || 8)
const LOCK_MS = Number(process.env.LOCK_MS || 10 * 60 * 1000)
// 可选：IP 白名单（这些 IP 免密通过）
const ALLOW_IPS = (process.env.ALLOW_IPS || '').split(',').map((s) => s.trim()).filter(Boolean)

if (!fs.existsSync(ROOT)) {
  console.error('[serve-prod] 未找到 dist/，请先执行 npm run build')
  process.exit(1)
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "script-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),
}

const failures = new Map() // ip -> { count, until }

const clientIp = (req) => {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

const timingSafeEqualStr = (a, b) => {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

const authorized = (req) => {
  if (!AUTH_ON) return true
  if (ALLOW_IPS.includes(clientIp(req))) return true
  const header = req.headers.authorization || ''
  if (!header.startsWith('Basic ')) return false
  let decoded = ''
  try {
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
  } catch {
    return false
  }
  const idx = decoded.indexOf(':')
  if (idx < 0) return false
  const user = decoded.slice(0, idx)
  const pass = decoded.slice(idx + 1)
  return timingSafeEqualStr(user, AUTH_USER) && timingSafeEqualStr(pass, AUTH_PASS)
}

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { ...SECURITY_HEADERS, ...headers })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const ip = clientIp(req)
  const now = Date.now()
  const state = failures.get(ip)
  if (state?.until && state.until > now) {
    return send(res, 429, 'Too Many Requests', { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' })
  }

  if (!authorized(req)) {
    const next = (state?.count || 0) + 1
    failures.set(ip, {
      count: next,
      until: next >= MAX_FAIL ? now + LOCK_MS : 0,
    })
    return send(res, 401, 'Unauthorized', {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm="Portfolio", charset="UTF-8"',
    })
  }
  if (state) failures.delete(ip)

  const rawPath = decodeURIComponent((req.url || '/').split('?')[0])
  if (rawPath.includes('\0')) return send(res, 400, 'Bad Request')

  // 隐藏文件（.env/.git/...）一律拒绝，不走 SPA 回退
  const segments = rawPath.split('/').filter(Boolean)
  if (segments.some((s) => s.startsWith('.'))) {
    return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' })
  }

  let filePath = path.resolve(ROOT, '.' + path.posix.normalize(rawPath))
  // 目录穿越防护：解析后必须仍在 dist 内
  if (!filePath.startsWith(ROOT)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' })
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }
  if (!fs.existsSync(filePath)) {
    // SPA 回退：非静态资源路径一律回 index.html
    const ext = path.extname(filePath)
    if (!ext) filePath = path.join(ROOT, 'index.html')
    else return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' })
  }
  if (!fs.existsSync(filePath)) {
    return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' })
  }

  const ext = path.extname(filePath)
  const isHashed = /-[A-Za-z0-9_]{8,}\.(js|css|woff2|png|jpg|jpeg|webp|svg|mp4)$/.test(path.basename(filePath))
  const body = fs.readFileSync(filePath)
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Length': body.length,
    'Cache-Control': isHashed ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  res.end(body)
})

server.listen(PORT, HOST, () => {
  console.log(`[serve-prod] 监听 http://${HOST}:${PORT}（目录 ${ROOT}）`)
  if (AUTH_ON) {
    console.log(`[serve-prod] 访问控制：Basic Auth 已开启（用户 ${AUTH_USER}）`)
  } else {
    console.log('[serve-prod] 访问控制：公开访问（未设置 AUTH_USER/AUTH_PASS）')
    console.log('[serve-prod] 仍已拦截：隐藏文件 / 目录穿越 / 目录列表')
  }
  console.log('[serve-prod] 隧道请指向这个地址；切勿把 dev server（5173）暴露出去')
})

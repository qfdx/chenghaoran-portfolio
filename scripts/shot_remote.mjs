// 带认证访问公网地址并截图（验证真实外部访问下的页面渲染）
// 用法：node scripts/shot_remote.mjs <url> <user> <pass> <out.png>
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const [url, user, pass, out] = process.argv.slice(2)

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const context = await browser.newContext({
  viewport: { width: 1600, height: 900 },
  httpCredentials: { username: user, password: pass },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const res = await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3500)
console.log('HTTP 状态:', res.status(), '| 最终 URL:', page.url())
console.log('标题:', await page.title())

const heroText = await page.evaluate(() => document.body.innerText.slice(0, 120).replace(/\n+/g, ' | '))
console.log('首屏文字:', heroText)

// 滚到收尾页截第二张
await page.evaluate(() => document.querySelector('#contact')?.scrollIntoView({ behavior: 'auto', block: 'start' }))
await page.waitForTimeout(2000)
await page.screenshot({ path: out })
console.log('截图已保存:', out)
console.log('页面错误:', errors.length ? errors.join(' | ') : '无')
await browser.close()

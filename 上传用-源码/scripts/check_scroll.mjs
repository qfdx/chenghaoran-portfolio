// 滚动动画验收：打开页面应停在顶部，滚动到各区块时进场动画应触发
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2] || 'http://127.0.0.1:5173/'

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

const atTop = await page.evaluate(() => ({ scrollY: window.scrollY, hash: location.hash }))

// 依次滚到各区块，检查进场动画是否触发（visibility/opacity/transform）
const sections = ['#about', '#projects', '#strengths', '#contact']
const results = []
for (const sel of sections) {
  await page.evaluate((s) => {
    document.querySelector(s).scrollIntoView({ behavior: 'auto', block: 'start' })
  }, sel)
  await page.waitForTimeout(160)
  const during = await page.evaluate((s) => {
    const root = document.querySelector(s)
    const anim = root.querySelector('[style*="visibility"]') || root
    const style = getComputedStyle(anim)
    return { opacity: style.opacity, transform: style.transform }
  }, sel)
  await page.waitForTimeout(1400)
  const state = await page.evaluate((s) => {
    const root = document.querySelector(s)
    const anim = root.querySelector('[style*="visibility"]') || root
    const style = getComputedStyle(anim)
    return {
      visibility: style.visibility,
      opacity: style.opacity,
      transform: style.transform,
    }
  }, sel)
  results.push({ sel, during: `${during.opacity} / ${during.transform}`, ...state })
}

await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'auto' }))
await page.waitForTimeout(600)
await page.screenshot({ path: 'C:/Users/lenovo/AppData/Local/Temp/check_scroll.png' })

console.log('打开时位置:', JSON.stringify(atTop))
results.forEach((r) => console.log('区块', r.sel, '→ 进场中:', r.during, '｜ 结束后:', r.visibility, 'opacity', r.opacity, r.transform))
console.log('页面错误:', errors.length ? errors.join(' | ') : '无')
await browser.close()

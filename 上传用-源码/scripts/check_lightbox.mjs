// 大图预览验收：点击照片 → 打开预览 → 图片完整不裁剪 → ESC/点空白/× 都能关闭
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2] || 'http://127.0.0.1:5173/'

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const check = async (name, openAction) => {
  await openAction()
  await page.waitForTimeout(900)
  const box = await page.evaluate(() => {
    const lb = document.querySelector('.lightbox')
    if (!lb) return null
    const img = lb.querySelector('img')
    const rect = img.getBoundingClientRect()
    return {
      open: true,
      natural: { w: img.naturalWidth, h: img.naturalHeight },
      shown: { w: Math.round(rect.width), h: Math.round(rect.height) },
      viewport: { w: window.innerWidth, h: window.innerHeight },
      hasClose: !!lb.querySelector('.lightbox__close'),
      hasCounter: !!lb.querySelector('.lightbox__counter'),
      bodyLocked: getComputedStyle(document.body).overflow === 'hidden',
    }
  })
  if (!box) {
    console.log(`✗ ${name}：预览未打开`)
    return false
  }
  // 完整显示判定：显示区域宽高比应与原图一致（contain），且不超出视口
  const natRatio = box.natural.w / box.natural.h
  const shownRatio = box.shown.w / box.shown.h
  const ratioOk = Math.abs(natRatio - shownRatio) < 0.03
  const fitsOk = box.shown.w <= box.viewport.w && box.shown.h <= box.viewport.h
  // 完整显示 = 等比缩放（不放大裁切、不压缩变形）
  const complete = box.shown.w <= box.natural.w + 1 && box.shown.h <= box.natural.h + 1

  console.log(`${name}：原图 ${box.natural.w}×${box.natural.h} → 显示 ${box.shown.w}×${box.shown.h}（视口 ${box.viewport.w}×${box.viewport.h}）`)
  console.log(`   宽高比一致(未裁剪): ${ratioOk ? '✅' : '❌'} | 未超视口: ${fitsOk ? '✅' : '❌'} | 缩放完整: ${complete ? '✅' : '❌'} | 关闭按钮: ${box.hasClose ? '✅' : '❌'} | 页码: ${box.hasCounter ? '✅' : '❌'} | 锁滚动: ${box.bodyLocked ? '✅' : '❌'}`)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  const closed = await page.evaluate(() => !document.querySelector('.lightbox'))
  console.log(`   ESC 关闭: ${closed ? '✅' : '❌'}`)
  return ratioOk && fitsOk && complete && box.hasClose && closed
}

// 按视口内可见的卡片坐标点击（transform 定位的元素用坐标点更稳）
const clickVisible = async (selector) => {
  const point = await page.evaluate((sel) => {
    const els = Array.from(document.querySelectorAll(sel))
    for (const el of els) {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      if (cx > 0 && cy > 0 && cx < window.innerWidth && cy < window.innerHeight && r.width > 4) {
        return { x: cx, y: cy }
      }
    }
    return null
  }, selector)
  if (!point) return false
  await page.mouse.click(point.x, point.y)
  return true
}

// ① 项目卡片 BounceCards
let ok1 = false
await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.evaluate(() => document.querySelector('#projects')?.scrollIntoView({ behavior: 'auto', block: 'start' }))
await page.waitForTimeout(2000)
ok1 = await check('① 项目卡片扇形图', async () => {
  await clickVisible('.bounce-cards__card')
})

// ② 关于页环形画廊
await page.evaluate(() => document.querySelector('#about')?.scrollIntoView({ behavior: 'auto', block: 'start' }))
await page.waitForTimeout(2500)
const ok2 = await check('② 关于页环形画廊', async () => {
  await clickVisible('.circular-carousel__frame')
})

// ③ 点空白处关闭
await page.evaluate(() => document.querySelector('#about')?.scrollIntoView({ behavior: 'auto', block: 'start' }))
await page.waitForTimeout(1500)
await clickVisible('.circular-carousel__frame')
await page.waitForTimeout(700)
const backdropClose = await page.evaluate(async () => {
  const lb = document.querySelector('.lightbox')
  if (!lb) return false
  lb.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await new Promise((r) => setTimeout(r, 300))
  return !document.querySelector('.lightbox')
})
console.log(`③ 点空白处关闭: ${backdropClose ? '✅' : '❌'}`)

console.log('页面错误:', errors.length ? errors.join(' | ') : '无')
await browser.close()
process.exit(ok1 && ok2 && backdropClose ? 0 : 1)

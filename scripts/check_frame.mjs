// 大图预览描边验收：SpecularFrame 边框是否渲染 / 是否随鼠标发光 / 原有交互是否保留
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2] || 'http://127.0.0.1:5173/'

const browser = await chromium.launch({ executablePath: EDGE, headless: true })
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(2500)
await page.evaluate(() => document.querySelector('#projects')?.scrollIntoView({ behavior: 'auto', block: 'start' }))
await page.waitForTimeout(2000)

const pt = await page.evaluate(() => {
  for (const el of document.querySelectorAll('.bounce-cards__card')) {
    const r = el.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    if (cx > 0 && cy > 0 && cx < innerWidth && cy < innerHeight && r.width > 4) return { x: cx, y: cy }
  }
  return null
})
if (pt) await page.mouse.click(pt.x, pt.y)
await page.waitForTimeout(1500)

const probe = await page.evaluate(() => {
  const frame = document.querySelector('.lightbox__frame')
  const canvas = frame?.querySelector('.specular-frame__light')
  const out = { hasFrame: !!frame, hasCanvas: !!canvas, painted: null, size: null }
  if (canvas) {
    const r = canvas.getBoundingClientRect()
    out.size = { w: Math.round(r.width), h: Math.round(r.height) }
    try {
      const c = document.createElement('canvas')
      c.width = 80
      c.height = 80
      const ctx = c.getContext('2d', { willReadFrequently: true })
      // 取画布中心区域（光带所在处）
      ctx.drawImage(canvas, canvas.width * 0.25, canvas.height * 0.25, canvas.width * 0.5, canvas.height * 0.5, 0, 0, 80, 80)
      const data = ctx.getImageData(0, 0, 80, 80).data
      let lit = 0
      let maxR = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 24) lit++
        if (data[i] > maxR) maxR = data[i]
      }
      out.painted = { lit, maxR }
    } catch (e) {
      out.painted = { error: String(e) }
    }
  }
  return out
})
console.log('描边框:', probe.hasFrame ? '✅ 存在' : '❌ 缺失', '| 光效画布:', probe.hasCanvas ? '✅ 存在' : '❌ 缺失', '| 尺寸:', JSON.stringify(probe.size))
console.log('画布绘制像素:', JSON.stringify(probe.painted))

// 鼠标移到图片左上角，看高光是否更亮
await page.mouse.move(700, 200)
await page.waitForTimeout(700)
const near = await page.evaluate(() => {
  const canvas = document.querySelector('.specular-frame__light')
  const c = document.createElement('canvas')
  c.width = 80; c.height = 80
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 80, 80)
  const data = ctx.getImageData(0, 0, 80, 80).data
  let lit = 0
  for (let i = 3; i < data.length; i += 4) if (data[i] > 24) lit++
  return lit
})
console.log('鼠标靠近后可见光像素:', near)

// 原有交互复核
await page.keyboard.press('ArrowRight')
await page.waitForTimeout(400)
const afterNext = await page.evaluate(() => document.querySelector('.lightbox__counter')?.textContent)
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
const closed = await page.evaluate(() => !document.querySelector('.lightbox'))
console.log('→ 键翻页:', afterNext, '| ESC 关闭:', closed ? '✅' : '❌')

await page.screenshot({ path: 'C:/Users/lenovo/AppData/Local/Temp/frame_shot.png' })
console.log('页面错误:', errors.length ? errors.join(' | ') : '无')
await browser.close()

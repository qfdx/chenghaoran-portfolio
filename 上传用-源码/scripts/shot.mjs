// 本地视觉验收脚本：驱动本机 Edge 真实渲染，截图 + 抓控制台错误
// 用法：node scripts/shot.mjs [url] [outfile] [waitMs] [scrollToSelector]
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const url = process.argv[2] || 'http://127.0.0.1:5173/'
const out = process.argv[3] || 'shot.png'
const waitMs = Number(process.argv[4] || 4000)
const scrollTo = process.argv[5] || ''

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })

const logs = []
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.stack || err.message}`))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(waitMs)

if (scrollTo) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, scrollTo)
  await page.waitForTimeout(2500)
}

// 环境与状态自检
const probe = await page.evaluate(() => {
  const canvases = Array.from(document.querySelectorAll('canvas')).map((c) => ({
    cls: c.className || '(none)',
    w: c.width,
    h: c.height,
    cw: c.clientWidth,
    ch: c.clientHeight,
  }))
  const shard = document.querySelector('.shard2d canvas')
  const aero = document.querySelector('.aero-shards-canvas')
  const readPixels = (src) => {
    if (!src) return null
    try {
      const probeCanvas = document.createElement('canvas')
      probeCanvas.width = 60
      probeCanvas.height = 60
      const pctx = probeCanvas.getContext('2d', { willReadFrequently: true })
      pctx.drawImage(src, 0, 0, 60, 60)
      const data = pctx.getImageData(0, 0, 60, 60).data
      let visible = 0
      let maxA = 0
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 6) visible++
        if (data[i] > maxA) maxA = data[i]
      }
      return { visible, maxA }
    } catch (e) {
      return { error: String(e) }
    }
  }
  let painted = readPixels(shard)
  const aeroPainted = readPixels(aero)
  return {
    webgpu: 'gpu' in navigator,
    canvases,
    shardPainted: painted,
    aeroCanvas: aero ? { w: aero.width, h: aero.height } : null,
    aeroPainted,
    shardFrames: window.__shardFrames || 0,
    shardError: window.__shardError || null,
    scrollY: window.scrollY,
    pageHeight: document.body.scrollHeight,
  }
})

await page.screenshot({ path: out })
console.log('PROBE:', JSON.stringify(probe, null, 2))
console.log('LOGS:\n' + (logs.slice(-25).join('\n') || '(无日志)'))
await browser.close()

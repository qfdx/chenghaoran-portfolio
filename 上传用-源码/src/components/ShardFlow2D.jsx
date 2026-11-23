import { useEffect, useRef } from 'react'

const TAU = Math.PI * 2

// 三条斜向碎片带（近似 AeroShards 的 full 布局：近处大而实，远处小而虚）
const BANDS = [
  { a: 0.34, b: -0.46, w: 0.045, depth: 0.95 },
  { a: 0.63, b: 0.34, w: 0.04, depth: 0.6 },
  { a: 0.13, b: 0.5, w: 0.035, depth: 0.34 },
]

// 2D Canvas 碎片流兜底：斜向碎片带 + 鼠标拨开 + 点击光环 + 长按聚拢
// WebGPU 不可用时顶上，保证碎片流体的观感与交互在任何浏览器都在
export default function ShardFlow2D({ count = 460, speed = 1 }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let raf = 0
    let w = 1
    let h = 1
    let dpr = 1
    let holding = false
    let gathered = false
    const mouse = { x: -9999, y: -9999, inside: false }
    const rings = []

    const makeShard = () => {
      const band = BANDS[Math.floor(Math.random() * BANDS.length)]
      const n = 3 + Math.floor(Math.random() * 3)
      const verts = []
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + (Math.random() - 0.5) * 0.8
        const rr = 0.6 + Math.random() * 0.8
        verts.push([Math.cos(ang) * rr, Math.sin(ang) * rr * 0.5])
      }
      const scale = 0.45 + band.depth * 0.85
      return {
        band,
        verts,
        s: Math.random(),
        lane: (Math.random() - 0.5) * 2 * band.w,
        size: (5 + Math.random() * 13) * scale,
        rot: Math.random() * TAU,
        vr: (Math.random() - 0.5) * 0.45,
        v: 0.016 + Math.random() * 0.05,
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        flash: 0,
        depth: band.depth * (0.72 + Math.random() * 0.35),
        speck: Math.random() < 0.18,
      }
    }
    const P = Array.from({ length: count }, makeShard)

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth || 1
      h = canvas.clientHeight || 1
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const local = (e) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        inside: e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right,
      }
    }
    const onMove = (e) => {
      const hit = local(e)
      mouse.x = hit.x
      mouse.y = hit.y
      mouse.inside = hit.inside
    }
    const onDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const hit = local(e)
      mouse.x = hit.x
      mouse.y = hit.y
      mouse.inside = true
      holding = true
      gathered = false
    }
    const onUp = (e) => {
      if (holding && !gathered) {
        const hit = local(e)
        rings.push({ x: hit.x, y: hit.y, age: 0 })
        if (rings.length > 4) rings.shift()
      }
      holding = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    let last = performance.now()
    const draw = (dt) => {      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      for (const ring of rings) ring.age += dt
      for (let i = rings.length - 1; i >= 0; i--) {
        if (rings[i].age > 2.4) rings.splice(i, 1)
      }

      // 先画远处的，再画近的（近的后画，压在上层）
      const sorted = P.slice().sort((a, b) => a.depth - b.depth)

      for (const p of sorted) {
        p.s += p.v * dt * speed
        if (p.s > 1.15) p.s = -0.15
        p.rot += p.vr * dt

        const bx = -0.12 + p.s * 1.24
        const by = p.band.a + p.band.b * (bx - 0.5) + p.lane
        let px = bx * w + p.ox
        let py = by * h + p.oy

        if (mouse.inside) {
          const dx = px - mouse.x
          const dy = py - mouse.y
          const d = Math.hypot(dx, dy) || 1
          if (holding) {
            if (d < 210) {
              const f = 1 - d / 210
              p.vx -= dx * f * 30 * dt
              p.vy -= dy * f * 30 * dt
              gathered = true
            }
          } else if (d < 120) {
            const f = 1 - d / 120
            p.vx += (dx / d) * f * 70 * dt
            p.vy += (dy / d) * f * 70 * dt
          }
        }

        for (const ring of rings) {
          const r = ring.age * 320
          const dx = px - ring.x
          const dy = py - ring.y
          const dist = Math.hypot(dx, dy)
          const gap = Math.abs(dist - r)
          if (gap < 34 && dist > 1) {
            p.flash = Math.max(p.flash, (1 - gap / 34) * (1 - ring.age / 2.4))
            const push = ((1 - gap / 34) * 120 * dt) / Math.max(dist, 8)
            p.vx += (dx / dist) * push * 60 * dt
            p.vy += (dy / dist) * push * 60 * dt
          }
        }

        p.vx += -8 * p.ox * dt
        p.vy += -8 * p.oy * dt
        p.vx *= Math.exp(-3 * dt)
        p.vy *= Math.exp(-3 * dt)
        p.ox += p.vx * dt
        p.oy += p.vy * dt
        p.flash *= Math.exp(-2.2 * dt)
        px = bx * w + p.ox
        py = by * h + p.oy

        const sz = p.size * (1 + p.flash * 0.4)
        const near = Math.min(1, p.depth)
        // 文字区（画面中部）自动变暗，保证标题可读
        const centerDim = 0.22 + 0.78 * Math.min(1, Math.abs(py / h - 0.5) * 2.4)
        const alpha = (0.26 + near * 0.55 + p.flash * 0.35) * centerDim

        if (p.speck) {
          ctx.globalAlpha = alpha * 0.9
          ctx.fillStyle = p.flash > 0.3 ? '#ffe9a8' : '#eab308'
          ctx.fillRect(px - sz * 0.08, py - sz * 0.08, Math.max(1.4, sz * 0.16), Math.max(1.4, sz * 0.16))
          ctx.globalAlpha = 1
          continue
        }

        ctx.save()
        ctx.translate(px, py)
        ctx.rotate(p.rot)
        ctx.beginPath()
        ctx.moveTo(p.verts[0][0] * sz, p.verts[0][1] * sz)
        for (let i = 1; i < p.verts.length; i++) {
          ctx.lineTo(p.verts[i][0] * sz, p.verts[i][1] * sz)
        }
        ctx.closePath()

        // 暗色玻璃体
        ctx.globalAlpha = 0.55 + near * 0.35
        ctx.fillStyle = '#0b0b0f'
        ctx.fill()

        // 金色棱边 + 近处辉光
        ctx.globalAlpha = alpha
        ctx.strokeStyle = p.flash > 0.25 ? '#ffe9a8' : '#eab308'
        ctx.lineWidth = 1 + near * 1.3 + p.flash * 1.2
        if (near > 0.6) {
          ctx.shadowColor = 'rgba(234, 179, 8, 0.55)'
          ctx.shadowBlur = 10 * near + p.flash * 14
        }
        ctx.stroke()
        ctx.restore()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
    }

    const tick = (now) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      try {
        draw(dt)
      } catch (err) {
        console.error('[ShardFlow2D] draw error', err)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [count, speed])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      aria-hidden="true"
    />
  )
}

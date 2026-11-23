import { useEffect, useRef, useState } from 'react'
import AeroShards from './AeroShards.jsx'

// 包一层 AeroShards：渲染后直接读画布像素验证「真的画出来了」
// 某些环境暴露 WebGPU 但画布永远空白，onError 不会触发，只能靠像素判定。
// status: 'checking' | 'alive' | 'blank'
export default function AeroShardsSafe({ onStatus, delay = 3200, ...props }) {
  const hostRef = useRef(null)
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const report = next => {
      setStatus(next)
      onStatus?.(next)
    }
    const timers = []
    const check = () => {
      const canvas = hostRef.current?.querySelector('canvas')
      if (!canvas) {
        report('blank')
        return
      }
      try {
        const probe = document.createElement('canvas')
        probe.width = 48
        probe.height = 48
        const pctx = probe.getContext('2d', { willReadFrequently: true })
        pctx.drawImage(canvas, 0, 0, 48, 48)
        const data = pctx.getImageData(0, 0, 48, 48).data
        let visible = 0
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 6) visible++
        }
        report(visible > 4 ? 'alive' : 'blank')
      } catch {
        // 读不到像素（跨域/格式限制），不武断判死
        report('alive')
      }
    }
    timers.push(setTimeout(check, delay))
    timers.push(setTimeout(() => {
      if (status !== 'alive') check()
    }, delay + 2200))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay])

  return (
    <div ref={hostRef} style={{ position: 'absolute', inset: 0 }}>
      <AeroShards {...props} onError={() => onStatus?.('blank')} />
    </div>
  )
}

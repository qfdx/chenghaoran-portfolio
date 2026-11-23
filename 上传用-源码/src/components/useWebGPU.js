import { useEffect, useState } from 'react'

// 主动探测 WebGPU 是否真正可用（有适配器且能建设备），3 秒超时视为不可用。
// 只看 'gpu' in navigator 不够：有些环境暴露了 API 但拿不到适配器，画布会永远空白。
export default function useWebGPU() {
  // null = 探测中，true/false = 探测结果
  const [ok, setOk] = useState(null)

  useEffect(() => {
    let alive = true
    const probe = (async () => {
      try {
        if (!('gpu' in navigator)) return false
        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) return false
        const device = await adapter.requestDevice()
        device.destroy?.()
        return true
      } catch {
        return false
      }
    })()
    const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 3000))
    Promise.race([probe, timeout]).then((result) => {
      if (alive) setOk(result)
    })
    return () => {
      alive = false
    }
  }, [])

  return ok
}

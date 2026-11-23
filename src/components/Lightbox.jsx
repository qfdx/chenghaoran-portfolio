import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import SpecularFrame from './SpecularFrame.jsx'

// 通用大图预览：完整显示不裁剪（object-fit: contain）
// 关闭方式：ESC / 点击空白区域 / 右上角关闭按钮
// 多图时支持 ← → 切换
export default function Lightbox({ items = [], index = 0, onClose, onPrev, onNext }) {
  const closeRef = useRef(null)
  const current = items[index]

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose?.()
      } else if (e.key === 'ArrowLeft') {
        onPrev?.()
      } else if (e.key === 'ArrowRight') {
        onNext?.()
      }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, onPrev, onNext])

  if (!current) return null

  const multi = items.length > 1

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={current.title || current.alt || '图片预览'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox__close"
        onClick={onClose}
        aria-label="关闭预览"
      >
        <span aria-hidden="true">×</span>
        <em>关闭 (Esc)</em>
      </button>

      {multi && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={onPrev}
          aria-label="上一张"
        >
          <span aria-hidden="true">‹</span>
        </button>
      )}

      <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <SpecularFrame
          radius={12}
          className="lightbox__frame"
          lineColor="#c6a45f"
          baseColor="#26262f"
          intensity={0.85}
          idleIntensity={0.36}
          shineSize={24}
          shineFade={36}
          thickness={1.8}
          glow={1.05}
          speed={0.26}
          proximity={280}
          autoAnimate
        >
          <img src={current.src} alt={current.alt || current.title || ''} />
        </SpecularFrame>
        {(current.title || current.subtitle) && (
          <figcaption className="lightbox__caption">
            {current.title}
            {current.subtitle && <span>{current.subtitle}</span>}
          </figcaption>
        )}
      </figure>

      {multi && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={onNext}
          aria-label="下一张"
        >
          <span aria-hidden="true">›</span>
        </button>
      )}

      {multi && (
        <div className="lightbox__counter">
          {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </div>
      )}
    </div>,
    document.body,
  )
}

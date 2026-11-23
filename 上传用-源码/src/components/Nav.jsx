import { useEffect, useState } from 'react'

const LINKS = [
  { href: '#about', label: '关于' },
  { href: '#projects', label: '项目' },
  { href: '#strengths', label: '优势' },
  { href: '#contact', label: '联系' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
      <div className="nav__inner">
        <a className="nav__logo" href="#top">
          <img className="nav__logo-mark" src="/images/logo-qingfeng.png" alt="清风编程" />
          <span className="nav__logo-sub">程浩然</span>
        </a>
        <nav className="nav__links">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <a className="nav__cta" href="#contact">联系我</a>
      </div>
    </header>
  )
}

const ICONS = {
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  stack: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 3 L21 8 L12 13 L3 8 Z" />
      <path d="M3 12 L12 17 L21 12" />
      <path d="M3 16 L12 21 L21 16" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2 L14 9 L21 12 L14 15 L12 22 L10 15 L3 12 L10 9 Z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20 c0-3.6 2.9-6 6.5-6 s6.5 2.4 6.5 6" />
      <path d="M16 5.5 a3.2 3.2 0 0 1 0 5.5 M17.5 14.5 c2.4 0.6 4 2.6 4 5.5" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5 a2 2 0 0 1 2-2 h14 v16 h-14 a2 2 0 0 0-2 2 Z" />
      <path d="M4 19 a2 2 0 0 1 2-2 h14" />
      <path d="M9 7 h7 M9 11 h5" />
    </svg>
  ),
}

import AnimatedContent from './AnimatedContent.jsx'
import { strengths } from '../data.js'

export default function Strengths() {
  return (
    <section className="strengths section" id="strengths">
      <div className="container">
        <AnimatedContent distance={90} duration={0.9} ease="power3.out" threshold={0.05}>
          <p className="section__index">03</p>
          <h2 className="section__title">个人优势</h2>
        </AnimatedContent>

        <AnimatedContent
          className="strengths__grid"
          distance={110}
          duration={0.9}
          ease="power3.out"
          stagger={0.08}
          threshold={0.05}
        >
          {strengths.map((s) => (
            <div key={s.title} className="scard">
              <div className="scard__icon">{ICONS[s.icon]}</div>
              <h3 className="scard__title">{s.title}</h3>
              <p className="scard__desc">{s.desc}</p>
            </div>
          ))}
        </AnimatedContent>
      </div>
    </section>
  )
}

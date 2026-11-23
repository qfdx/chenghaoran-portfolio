import { useState } from 'react'
import TechText from './TechText.jsx'
import { profile } from '../data.js'

export default function Hero() {
  // Hero 保持视频背景（按需求不改），碎片流只用于收尾页
  const [videoBroken, setVideoBroken] = useState(false)

  return (
    <section className="hero" id="top">
      <div className="hero__media" aria-hidden="true">
        {!videoBroken && (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/media/hero-poster.jpg"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          >
            <source src="/media/hero-bg.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero__overlay" />
      </div>

      <div className="hero__inner">
        <p className="hero__kicker">
          <span className="hero__kicker-dot" />
          {profile.school} · {profile.major}
        </p>
        <h1 className="hero__title">
          <span className="hero__wordmark">
            <TechText
              text={profile.name}
              fontSize={170}
              fontWeight={900}
              align="left"
              color="#eceae4"
              accentColor="#d4af37"
              reveal="letter"
              intro="assemble"
              introDuration={2.2}
              specks={15}
              clickKick
              guides={false}
              labels={false}
            />
          </span>
          <span className="hero__title-en">{profile.enName}</span>
        </h1>
        <p className="hero__tagline">{profile.tagline}</p>
        <div className="hero__actions">
          <a className="btn btn--gold" href="#projects">查看精选项目</a>
          <a className="btn btn--ghost" href="#contact">联系我</a>
        </div>
      </div>

      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}

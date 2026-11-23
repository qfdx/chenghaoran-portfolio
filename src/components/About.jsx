import { useState } from 'react'
import AnimatedContent from './AnimatedContent.jsx'
import CircularCarousel from './CircularCarousel.jsx'
import Lightbox from './Lightbox.jsx'
import { profile, stats, awards, gallery } from '../data.js'

export default function About() {
  const [preview, setPreview] = useState(null) // 选中的图片序号

  return (
    <section className="about section" id="about">
      <div className="container">
        <AnimatedContent distance={90} duration={0.9} ease="power3.out" threshold={0.05}>
          <p className="section__index">01</p>
          <h2 className="section__title">个人经历</h2>
        </AnimatedContent>

        <AnimatedContent distance={110} duration={1} ease="power3.out" threshold={0.05}>
          <div className="about__grid">
            {/* 左：环形画廊 + 联系方式 */}
            <div className="about__side">
              <div className="about__carousel">
                <CircularCarousel
                  items={gallery}
                  preset="cylinder"
                  intro="rise"
                  cardWidth={190}
                  aspectRatio={0.85}
                  speed={12}
                  captions
                  fadeColor="#0a0a0c"
                  onItemClick={(item, index) => setPreview(index)}
                />
              </div>
              <div className="about__meta">
                <p className="about__meta-row"><span>坐标</span>{profile.contacts.location}</p>
                <p className="about__meta-row"><span>邮箱</span>{profile.contacts.email}</p>
                {profile.contacts.github && (
                  <p className="about__meta-row"><span>主页</span>{profile.contacts.github}</p>
                )}
              </div>
            </div>

            {/* 右：介绍 */}
            <div className="about__body">
              {profile.bio.map((p, i) => (
                <p key={i} className="about__para">{p}</p>
              ))}

              <div className="about__stats">
                {stats.map((s) => (
                  <div key={s.label} className="stat">
                    <p className="stat__value">
                      {s.value}<span className="stat__suffix">{s.suffix}</span>
                    </p>
                    <p className="stat__label">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="about__awards">
                <p className="about__awards-title">荣誉</p>
                {awards.map((a) => (
                  <p key={a} className="about__award">{a}</p>
                ))}
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>

      {preview !== null && (
        <Lightbox
          items={gallery}
          index={preview}
          onClose={() => setPreview(null)}
          onPrev={() => setPreview((i) => (i - 1 + gallery.length) % gallery.length)}
          onNext={() => setPreview((i) => (i + 1) % gallery.length)}
        />
      )}
    </section>
  )
}

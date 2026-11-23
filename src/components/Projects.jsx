import { useState } from 'react'
import AnimatedContent from './AnimatedContent.jsx'
import BounceCards from './BounceCards.jsx'
import Lightbox from './Lightbox.jsx'
import { projects } from '../data.js'

function ProjectCard({ p, i }) {
  const imgs = p.images || []
  const [preview, setPreview] = useState(null) // { index }

  const items = imgs.map((src, t) => ({ src, alt: `${p.title} 截图 ${t + 1}`, title: p.title, subtitle: `截图 ${t + 1}` }))

  return (
    <article className={`pcard ${i % 2 === 1 ? 'pcard--flip' : ''}`}>
      <div className="pcard__media pcard__media--fan">
        {imgs.length > 0 ? (
          <BounceCards
            images={imgs.map((src, t) => ({ src, alt: `${p.title} 截图 ${t + 1}` }))}
            containerWidth={480}
            containerHeight={340}
            cardSize={210}
            spread={imgs.length > 3 ? 78 : 110}
            rotation={8}
            arc={0}
            pushDistance={150}
            hoverScale={1.05}
            bounciness={0.6}
            animationDelay={0.4}
            animationStagger={0.08}
            borderWidth={3}
            borderColor="#2a2a30"
            radius={14}
            shadow
            enableHover
            onCardClick={(index) => setPreview({ index })}
          />
        ) : (
          <span className="pcard__media-fallback">项目截图占位</span>
        )}
        <span className="pcard__num">{String(i + 1).padStart(2, '0')}</span>
      </div>

      <div className="pcard__content">
        <p className="pcard__subtitle">{p.subtitle}</p>
        <h3 className="pcard__title">{p.title}</h3>
        <p className="pcard__summary">{p.summary}</p>
        <ul className="pcard__highlights">
          {p.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="pcard__foot">
          <div className="pcard__tags">
            {p.tags.map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
          {p.link && (
            <span className="pcard__link" title={`已上线：${p.link}`}>
              ● 已上线
            </span>
          )}
        </div>
      </div>

      {preview && (
        <Lightbox
          items={items}
          index={preview.index}
          onClose={() => setPreview(null)}
          onPrev={() => setPreview((s) => ({ index: (s.index - 1 + items.length) % items.length }))}
          onNext={() => setPreview((s) => ({ index: (s.index + 1) % items.length }))}
        />
      )}
    </article>
  )
}

export default function Projects() {
  return (
    <section className="projects section" id="projects">
      <div className="container">
        <AnimatedContent distance={90} duration={0.9} ease="power3.out" threshold={0.05}>
          <p className="section__index">02</p>
          <h2 className="section__title">精选项目</h2>
        </AnimatedContent>

        <div className="projects__list">
          {projects.map((p, i) => (
            <AnimatedContent
              key={p.id}
              distance={120}
              duration={1}
              ease="power3.out"
              threshold={0.12}
            >
              <ProjectCard p={p} i={i} />
            </AnimatedContent>
          ))}
        </div>
      </div>
    </section>
  )
}

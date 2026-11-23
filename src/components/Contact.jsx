import { useState } from 'react'
import AnimatedContent from './AnimatedContent.jsx'
import AeroShardsSafe from './AeroShardsSafe.jsx'
import ShardFlow2D from './ShardFlow2D.jsx'
import useWebGPU from './useWebGPU.js'
import { profile } from '../data.js'

export default function Contact() {
  const gpuOk = useWebGPU()
  // 'checking' | 'alive' | 'blank'
  const [shardStatus, setShardStatus] = useState('checking')
  const show3D = gpuOk === true && shardStatus !== 'blank'
  // 3D 碎片确认可用后，把 2D 兜底层淡出；不可用时 2D 层一直顶在下面
  const layer2D = shardStatus === 'alive' ? 'shard2d--off' : ''

  return (
    <footer className="contact" id="contact">
      <div className="contact__bg" aria-hidden="true">
        <div className={`shard2d ${layer2D}`}>
          <ShardFlow2D count={240} speed={1} />
        </div>
        {show3D && (
          <AeroShardsSafe
            onStatus={setShardStatus}
            shardColor="#000000"
            accentColor="#eab308"
            placement="full"
            material="glass"
            markers="plus"
            count={1300}
            depthOfField={0.75}
            vignette={0.3}
            mouseInteraction
            pulseOnClick
            holdToGather
          />
        )}
      </div>
      <div className="contact__anim">
        <AnimatedContent
          distance={110}
          duration={1}
          ease="power3.out"
          trigger="mount"
          className="contact__inner-wrap"
        >
          <div className="contact__inner">
            <p className="contact__kicker">LET'S BUILD SOMETHING</p>
            <h2 className="contact__title">
              让控制系统<br />在真实世界里<span className="gold">转起来</span>
            </h2>
            <p className="contact__sub">
              对机器人控制、具身智能、嵌入式开发感兴趣？欢迎通过邮箱与我联系。
            </p>

            <div className="contact__actions">
              <a className="btn btn--gold btn--lg" href={`mailto:${profile.contacts.email}`}>
                {profile.contacts.email}
              </a>
            </div>

            <div className="contact__links">
              <div className="contact__item">
                <span>邮箱</span>
                <p>{profile.contacts.email}</p>
              </div>
              <div className="contact__item">
                <span>坐标</span>
                <p>{profile.contacts.location}</p>
              </div>
              <div className="contact__item">
                <span>身份</span>
                <p>武汉大学 · 智能制造工程</p>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>

      <div className="contact__bar">
        <p>© 2026 {profile.name} · {profile.enName}</p>
        <p>Built with React + Vite</p>
      </div>
    </footer>
  )
}

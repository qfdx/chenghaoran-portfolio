// ============ 站点数据 ============
// 所有个人信息集中在这里，后续换素材/改文案只动这个文件。

export const profile = {
  name: '程浩然',
  enName: 'Cheng Haoran',
  role: '控制方向 · AI Geek',
  school: '武汉大学 动力与机械学院',
  major: '智能制造工程 · 本科一年级',
  period: '2026.09 — 2030.06',
  tagline: '深耕自动控制 / 嵌入式 / 机器人控制，面向具身智能应用。',
  bio: [
    '武汉大学智能制造工程 2026 级本科生，方向锁定自动控制、嵌入式与机器人控制，关注具身智能的落地应用。现阶段以 Python 打编程基础，同步系统学习 C 语言，用竞赛和真实项目积累工程经验。',
    '入学第一年即以队长身份完成一个校级「揭榜挂帅」AI 创新项目的全流程交付——从 808 行需求文档、规则外置的比对引擎，到 298 条自动化测试与真实业务链路验收。相信控制系统的可靠性来自工程化的每一个细节。',
  ],
  // 注意：手机号/微信不上站（防爬虫），确认后再加
  contacts: {
    email: '3134675963@qq.com',
    github: '', // TODO: 补 GitHub/Gitee 链接
    location: '湖北 · 武汉',
  },
  avatar: '/images/avatar.jpg', // 占位，替换为真实照片
}

export const stats = [
  { value: '808', label: '行产品需求文档', suffix: '' },
  { value: '8600', label: '评审合并代码', suffix: '+' },
  { value: '298', label: '自动化测试', suffix: '' },
  { value: '0', label: '真实材料误报', suffix: '' },
]

export const projects = [
  {
    id: 'qingyun',
    title: '「擎云助手」社会实践全流程数字化管理平台',
    subtitle: '队长 / 全栈与核心引擎 · 2026',
    // 多图画廊：材料审核流程 / 登录页 / 材料对账工作台
    images: [
      '/images/projects/qingyun-flow.jpg',
      '/images/projects/qingyun-login.png',
      '/images/projects/qingyun-dashboard.png',
    ],
    tags: ['React 18', 'TypeScript', 'Supabase', '自动化测试', '团队领导'],
    summary:
      'AI 创新设计大赛校级「揭榜挂帅」专项立项（榜题 #13）。覆盖「申报—审批—组队—建档—材料—结项」12 个环节的全流程数字化管理，自建 Supabase 部署，数据不出校。',
    highlights: [
      '独立撰写 808 行 PRD v5.0，按模块拆解任务分派 4 人团队',
      '主导核心比对引擎：规则外置 YAML 配置、「先归一再比对」架构，真实材料验收零误报，精确识别 6 处差异',
      '评审并合并 Gitee 提交 22 次、约 8600 行代码；298 条自动化测试全部通过',
      '浏览器自动化实测 12 步业务链路，发现 3 个真实缺陷并推动 3 天内修复闭环',
      '学院仅 2 支立项队伍之一，角逐 2/6 评优；后续拟部署「智慧珞珈」平台全校推广',
    ],
    link: '',
  },
  {
    id: 'polar-quiz',
    title: '「南北极科考闯关」线下展馆答题平台',
    subtitle: '独立开发 / AI 图像判定 · 2026',
    images: [
      '/images/projects/quiz-login.jpg',
      '/images/projects/quiz-task.jpg',
      '/images/projects/quiz-check.jpg',
      '/images/projects/quiz-admin.jpg',
    ],
    tags: ['移动端 Web', 'AI 图像判定', '登录体系', '积分排行', '管理后台'],
    summary:
      '为展馆线下科考活动打造的闯关答题平台（已上线）：领任务 → 找到展品 → 拍同款照 → 完成答题，AI 判定现场照片真实性，积分实时计入个人与队伍榜。',
    highlights: [
      'AI 现场照判定：拍屏/地点不符直接驳回并给出置信度反馈，杜绝云代拍',
      '多通道登录体系：免短信一键进入为主，短信验证码 / WorkBuddy / 微信扫码备用',
      '个人积分 + 队伍加分双榜设计，前五名给队伍附加分，带动团队参与',
      '管理端实时答题记录与人工复核流：登记人数、提交/通过次数、逐题 AI 判定理由可回溯',
    ],
    link: 'polar-quiz-checkin.app.workbuddy.host',
  },
]

export const strengths = [
  {
    title: '方向锁定：控制与具身智能',
    desc: '自动控制 / 嵌入式 / 机器人控制三线并进，所有学习路径都围绕控制应用展开——学语言是为了做系统，不是为了学语法。',
    icon: 'target',
  },
  {
    title: '全栈独立交付能力',
    desc: 'PRD → 架构设计 → 前端实现 → 数据库与 RLS 权限 → 自动化测试 → 验收闭环，一个人能走完一整条产品链路。',
    icon: 'stack',
  },
  {
    title: '工程化思维',
    desc: '规则外置 YAML（改规则不改代码）、先归一再比对、298 条测试兜底——用工程手段保证系统可靠性，这是控制人的本能。',
    icon: 'gear',
  },
  {
    title: 'AI 工具深度实践者',
    desc: 'WorkBuddy、AnythingLLM 等 AI 工具的日常重度使用与本地化部署尝试，把 AI 变成开发与学习的杠杆。',
    icon: 'spark',
  },
  {
    title: '团队组织与领导',
    desc: '班长 + 项目队长的双重角色：拆解任务、评审代码、推动缺陷 3 天修复闭环，习惯让协作跑在流程上而不是嗓门上。',
    icon: 'users',
  },
  {
    title: '技术与语言双底子',
    desc: '高考英语 133/150，可直接阅读英文技术文档，备考 CET-4；数学基础课（高数 / 线代）系统在学。',
    icon: 'book',
  },
]

export const awards = [
  '武汉大学足球新生杯冠军（2026）',
  '高中三好学生 / 优秀班干部',
]

// 「关于」页环形画廊：形象 + 作品截图 + 代码
export const gallery = [
  { src: '/images/avatar.jpg', alt: '个人形象', title: '程浩然', subtitle: 'AI Geek' },
  { src: '/images/projects/qingyun-flow.jpg', alt: '擎云助手材料审核流程', title: '擎云助手', subtitle: '材料审核流' },
  { src: '/images/projects/qingyun-login.png', alt: '擎云助手登录页', title: '擎云助手', subtitle: '登录页' },
  { src: '/images/projects/qingyun-dashboard.png', alt: '擎云助手材料对账工作台', title: '擎云助手', subtitle: '材料对账台' },
  { src: '/images/projects/quiz-task.jpg', alt: '科考闯关答题任务', title: '科考闯关', subtitle: '答题任务' },
  { src: '/images/projects/quiz-check.jpg', alt: '科考闯关 AI 照片判定', title: '科考闯关', subtitle: 'AI 照片判定' },
  { src: '/images/projects/quiz-admin.jpg', alt: '科考闯关管理端', title: '科考闯关', subtitle: '管理端' },
  { src: '/images/code/02-normalize.png', alt: '归一化引擎代码', title: '比对引擎', subtitle: 'Normalize' },
  { src: '/images/code/04-reconcile.jpg', alt: '逐人引擎代码', title: '比对引擎', subtitle: 'Reconcile' },
]

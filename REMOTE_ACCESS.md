# 个人网站远程访问方案（公开站版）

> ## ✅ 永久地址（2026-11-23 已上线，Cloudflare Pages）
>
> **https://chenghaoran.pages.dev**
>
> - 托管在 Cloudflare 全球边缘，**与你的电脑无关**：关机、断网、进程退出都不影响
> - 默认域名**公开可访问**、免备案、免费；国内 DNS 解析干净（腾讯/阿里 DNS 均返回 `172.66.44.67 / 172.66.47.189`）
> - 已验证：首页 200；js/视频/图片/favicon 全部 200 且 MIME 正确；大图预览（BounceCards / 环形画廊）六项交互全部通过；页面无 JS 报错
> - 未知路径会回退为首页 HTML（SPA 行为），**不泄露任何源码或 `.env` 内容**
> - 更新方式：本地 `npm run build` → 重新打包 → Pages 项目里「Create a new deployment」上传 zip
>
> 下面是早年基于本地服务 + 隧道的一套方案，**保留作应急/局域网备选**。



> 目标：让**不在同一网络**（外网 / 移动网络）的老师、同学等访问本机运行的作品集。
> 核心原则：**只暴露构建产物，不暴露开发环境；站点本身公开可看，但源码、配置、目录一律不泄露；全程可验收。**

---

## 一、整体架构（四层）

```
外部访客浏览器（无需登录）
   │  HTTPS（TLS 由隧道边缘提供）
   ▼
[隧道入口]  Cloudflare Tunnel（唯一入口）
   │  回源到本机 127.0.0.1:4173（只监听回环地址）
   ▼
[加固服务]  scripts/serve-prod.mjs
   │  ① 隐藏文件拦截 ② 目录穿越拦截 ③ 无目录列表
   │  ④ 安全响应头 ⑤ 可选 Basic Auth（默认关闭）
   ▼
[静态产物]  dist/（npm run build 生成：无源码、无 sourcemap、无 .env）
```

**绝不能暴露的东西**：
- ❌ Vite 开发服务器（5173）——带 HMR WebSocket、`/@fs/` 可读项目源码。本项目 `vite.config.js` 已固定 `host: '127.0.0.1'`，仅本机可连。
- ❌ 任何 Supabase 服务端密钥（service_role key）。前端只有 anon key，安全性由数据库 **RLS 行级权限**保证（擎云助手本身就是这套设计的实践）。

---

## 二、隧道通道选型（含本机实测连通性）

本机（武汉电信）实测：GitHub 主站被墙，cloudflare.com / npm / npmmirror / gh 镜像可达。

| 方案 | 本机可达性 | 账号要求 | 访问控制 | 适用场景 |
|---|---|---|---|---|
| **Cloudflare Tunnel（quick tunnel）** | ✅ 可达（经 gh 镜像下载二进制） | 无需账号 | 站点公开 | 临时分享、给老师看 |
| **Cloudflare Tunnel（命名隧道 + Access）** | ✅ 同上 | 需 Cloudflare 账号 + 域名 | 可选：仅放行指定邮箱 | 长期稳定链接 |
| **自建 frp + 国内云服务器** | ✅ 需一台有公网 IP 的机器 | 需 VPS | 自建，最可控 | 追求国内访问速度 |
| Tailscale Funnel | ⚠️ 主站被墙（登录域可达） | 需账号 | tailnet ACL | 给固定几个人 |
| ngrok / localtunnel | ❌ 实测被墙 | — | — | 本机不适用 |

### 命令

```bash
# 1) 构建生产产物
npm run build

# 2) 启动加固服务（只监听 127.0.0.1:4173，公开模式）
npm run serve

# 3) 起隧道（临时隧道：进程重启 URL 会变）
E:\新闻\其他\tools\cloudflared.exe tunnel --url http://127.0.0.1:4173 --no-autoupdate
#    日志里出现 https://xxxx-yyyy-zzz.trycloudflare.com

# 4) 长期方案：命名隧道 + 自有域名 + Cloudflare Access（邮箱白名单）
cloudflared tunnel login
cloudflared tunnel create portfolio
cloudflared tunnel route dns portfolio portfolio.yourdomain.com
cloudflared tunnel run portfolio
#    Cloudflare Zero Trust → Access → Applications → 加 "Allow / Email" 策略
```

> 隧道**只回源 127.0.0.1:4173**，永远不要指向 5173。

---

## 三、访问控制与安全配置

### 本次决策：站点公开
作品集是给老师看的，**不设密码**。访客拿到链接即可浏览，这符合作品集的常规形态（和 GitHub Pages / 个人博客一样）。
代价是：**链接一旦发出就等于公开**，无法只让特定人访问。若日后想收紧，Cloudflare Access 可以加"仅允许这几个邮箱"，无需密码。

### 无论公开与否都保留的防护（已内置 `scripts/serve-prod.mjs`）
1. **信息泄露防护**
   - 隐藏文件（`.env` / `.git` / 任何点开头路径）→ 404
   - 目录穿越（`/../`、`/@fs/`）→ 403/404
   - 目录列表 → 404
   - SPA 回退只对无扩展名路径生效，静态目录仍 404
   - 构建产物不含 sourcemap，不含 `.env`（确认：`vite build` 默认 `sourcemap: false`）
2. **安全响应头**：`Content-Security-Policy`（脚本源限 'self'、放行 Supabase 连接与 Google Fonts）、`X-Content-Type-Options: nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`。
3. **仅回环监听**：默认 `HOST=127.0.0.1`，公网只能经隧道进来；路由器无需任何端口映射。
4. **可选能力**（当前关闭，需要时开）
   - Basic Auth：同时设置 `AUTH_USER` 与 `AUTH_PASS` 即开启（恒定时间比较 + 失败 8 次锁 10 分钟）
   - IP 白名单：`ALLOW_IPS=1.2.3.4,5.6.7.8` 让指定 IP 免密通过
5. **TLS**：Cloudflare 边缘自动签发证书并强制 HTTPS。

### 公开后仍需注意
- **邮箱会被爬虫收录**：站点联系区的 QQ 邮箱是明文。若在意，可用邮箱别名/表单替代。
- **Supabase 数据仍受 RLS 保护**：公开的是前端页面，不是数据表。
- **看日志**：隧道与本服务都记录请求路径，异常扫描会明显增多。

---

## 四、验收方法

### 自动化验收（`scripts/check_access.mjs`）
```bash
node scripts/check_access.mjs <公网URL>            # 公开模式
node scripts/check_access.mjs <公网URL> <user> <pass>  # 认证模式
```
判据：
- 公开模式：首页 200；`/assets/`、`/.env`、`/@fs/…`、`/src/main.jsx`、`/../package.json`、`/.git/config` 全部 404
- 认证模式：无凭据/错密码 401，正确凭据 200，敏感路径同样全 404

### 人工验收（必须做，脚本只能证明一半）
1. **真正的外网**：手机关 Wi-Fi、开 5G 流量访问公网地址 → 正常显示作品集（**这一步不可省略**，它验证真实外网可达）。
2. **未授权内容不可见**：随机试几个路径（`/.env`、`/assets/`）→ 都是 404，不应出现任何源码或配置。
3. **隧道关闭后**：停掉 cloudflared → 原公网 URL 立即不可访问（说明没有旁路暴露）。
4. **端口暴露面**：`netstat` 确认 5173 / 4173 都只监听 127.0.0.1。

---

## 六、地址管理（重要：临时隧道每次重启都会换地址）

### 一键脚本
| 文件 | 作用 |
|---|---|
| `start-site.bat` | 双击即：确保生产服务在跑 → 确保隧道在跑 → **把当前公网地址复制到剪贴板** → 写入 `公网地址.txt` |
| `install-autostart.bat` | 双击即注册"登录自启"计划任务（任务名 `PortfolioSite`），开机登录后网站自动上线 |
| `公网地址.txt` | 当前可用公网地址，随时可查 |

### 为什么地址会变
quick tunnel 每次启动都由 Cloudflare 随机分配一个域名，**没有账号就没有固定域名**。所以：
- 旧地址会变成 `Error 1033`（Cloudflare Tunnel error）——含义是"这个域名指向的隧道已经不存在了"，不是网站出错；
- 新的地址从 `公网地址.txt` 取，或跑一次 `start-site.bat` 拿到（自动进剪贴板）。

### 想彻底解决地址漂移（二选一）
1. **Cloudflare 命名隧道 + 自有域名**（推荐，一次配置长期有效）
   ```bash
   cloudflared tunnel login            # 浏览器里登录 Cloudflare 账号
   cloudflared tunnel create portfolio
   cloudflared tunnel route dns portfolio portfolio.你的域名.com
   cloudflared tunnel run portfolio
   ```
   再把 `start-site.ps1` 里的 quick tunnel 部分换成 `cloudflared tunnel run portfolio`。
2. **把 quick tunnel 挂在常驻进程里**（`install-autostart.bat`）：地址只在**重启电脑**时才变，日常不会变。

---

## 七、常用命令速查

```bash
npm run dev            # 本地开发（仅本机）
npm run build          # 构建生产产物到 dist/
npm run serve          # 启动加固静态服务（127.0.0.1:4173，公开模式）
npm run verify:access  # 访问控制验收
npm run shot           # 用本机 Edge 真实渲染截图 + 抓控制台错误
```

---

## 六、本次实况（2026-11-22 已验证）

**公网地址（临时隧道，进程重启后 URL 会变）：**
```
https://ends-joining-proportion-work.trycloudflare.com
```
**无需密码，访客直接访问即可。** 当前地址同时写在项目根目录 `公网地址.txt`，跑一次 `start-site.bat` 会自动复制到剪贴板。

| 验收项 | 结果 |
|---|---|
| 匿名访问首页 | HTTP 200，页面完整渲染（视频背景 / TechText 标题 / 碎片流背景均正常） |
| `/assets/` 目录列表 | HTTP 404 |
| `/.env`、`/.git/config` | HTTP 404 |
| `/@fs/…`、`/src/main.jsx`、`/../package.json` | HTTP 404 |
| dev server 暴露面 | 5173 仅监听 127.0.0.1，公网取不到任何源码路径 |
| 隧道关闭后 | 停掉 cloudflared 即立即不可访问 |

**长期化建议：**
1. 换**命名隧道 + 自有域名**，链接固定不变，老师随时能打开（quick tunnel 每次重启换地址）。
2. 把 `serve-prod` 与 `cloudflared` 注册成**开机自启**（Windows 计划任务 / NSSM），否则睡眠或关机链接即断。
3. 若希望"只有特定老师能看"，在 Cloudflare Access 加邮箱白名单即可，不必回到密码。

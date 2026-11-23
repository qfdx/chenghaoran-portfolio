﻿# 发布到 Cloudflare Pages -> 永久网址（免费、pages.dev）
# 用法：双击 桌面「发布永久网址.bat」
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot '.workbuddy\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $ProjectRoot
. (Join-Path $PSScriptRoot 'toolpaths.ps1')
$NODE = Find-Tool 'node.exe'
$NPX = Find-Tool 'npx.cmd'
if (-not $NPX) { Write-Host '[deploy] 找不到 npx.cmd' -ForegroundColor Red; Read-Host '按回车退出'; exit 1 }
if ($NODE) { $env:PATH = (Split-Path -Parent $NODE) + ';' + $env:PATH }

function Info($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor DarkGray }
function Good($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Yellow }

foreach ($dup in @('http_proxy', 'https_proxy', 'all_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY')) {
  try { Remove-Item ('Env:' + $dup) -ErrorAction SilentlyContinue } catch {}
}

Info ('项目目录: ' + $ProjectRoot)

# ---------- 0. 登录状态判定（看凭据文件，最可靠） ----------
$CfConfig = Join-Path $env:APPDATA 'xdg.config\.wrangler\config\default.toml'
function Test-CfLogin {
  if ($env:CLOUDFLARE_API_TOKEN) { return $true }
  if (Test-Path $CfConfig) {
    $raw = Get-Content $CfConfig -Raw -ErrorAction SilentlyContinue
    if ($raw -and ($raw -match 'oauth_token|api_token|account_id')) { return $true }
  }
  return $false
}

$logged = Test-CfLogin

if (-not $logged) {
  Write-Host ''
  Write-Host '  需要登录 Cloudflare（只需一次，免费用邮箱注册）' -ForegroundColor Yellow
  Write-Host '  下面会自动打开浏览器，点「Allow / 允许」即可' -ForegroundColor Yellow
  Write-Host ''
  for ($i = 1; $i -le 3 -and -not $logged; $i++) {
    Write-Host ('[登录 ' + $i + '/3] 正在打开授权页面...') -ForegroundColor Yellow
    & $NPX wrangler login
    Start-Sleep -Seconds 2
    $logged = Test-CfLogin
    if (-not $logged) { Warn '这轮未完成授权（可能是超时），2 秒后自动重试' ; Start-Sleep -Seconds 2 }
  }
}

if (-not $logged) {
  Write-Host ''
  $tok = Read-Host '若你已在控制台创建 API Token，粘到这里（直接回车跳过）'
  if ($tok) {
    $env:CLOUDFLARE_API_TOKEN = $tok.Trim()
    $logged = $true
    Good '已使用 API Token 继续'
  }
}

if (-not $logged) {
  Warn '仍未完成 Cloudflare 登录，本次发布取消。'
  Write-Host ''
  Write-Host '  备选方案（二选一）：' -ForegroundColor Cyan
  Write-Host '   A. 重新双击本脚本，浏览器弹出后 2 分钟内点「Allow」' -ForegroundColor Gray
  Write-Host '   B. 去控制台建 API Token，然后在本窗口执行：' -ForegroundColor Gray
  Write-Host '      set CLOUDFLARE_API_TOKEN=你的token' -ForegroundColor Gray
  Write-Host '      https://dash.cloudflare.com/profile/api-tokens -> Create Token -> Edit Cloudflare Workers' -ForegroundColor DarkGray
  Write-Host ''
  Read-Host '按回车退出'
  exit 1
}
Good 'Cloudflare 登录状态正常'

# ---------- 1. 构建 ----------
Info '构建生产产物...'
& $NPX vite build
if ($LASTEXITCODE -ne 0) { Warn '构建失败'; Read-Host '按回车退出'; exit 1 }

# ---------- 2. 确保 Pages 项目存在 ----------
Info '检查 Pages 项目 ch-haoran ...'
& $NPX wrangler pages project create ch-haoran --production-branch=main *>&1 | Out-Null
# 已存在会报错，忽略即可

# ---------- 3. 发布（不接管 stdout，否则 wrangler 会判定为非交互环境） ----------
Info '发布到 Cloudflare Pages（项目名 ch-haoran）...'
$transcript = Join-Path $LogDir 'pages-deploy.log'
if (Test-Path $transcript) { Remove-Item $transcript -Force -ErrorAction SilentlyContinue }
$started = $false
try { Start-Transcript -Path $transcript -Force | Out-Null; $started = $true } catch {}

& $NPX wrangler pages deploy dist --project-name=ch-haoran --branch=main --commit-dirty=true
$code = $LASTEXITCODE

if ($started) { try { Stop-Transcript | Out-Null } catch {} }

# ---------- 4. 输出永久地址 ----------
$url = $null
if (Test-Path $transcript) {
  $hit = Select-String -Path $transcript -Pattern 'https://[a-z0-9.-]+\.pages\.dev' -AllMatches | Select-Object -Last 1
  if ($hit) { $url = $hit.Matches[0].Value }
}

if ($url) {
  Set-Content -Path (Join-Path $ProjectRoot '公网地址.txt') -Value $url -Encoding utf8
  try { Set-Clipboard -Value $url } catch {}
  Write-Host ''
  Write-Host '==============================================' -ForegroundColor DarkGray
  Write-Host '  永久网址已生成（已复制到剪贴板）:' -ForegroundColor Green
  Write-Host ('    ' + $url) -ForegroundColor Yellow
  Write-Host '  已写入 公网地址.txt' -ForegroundColor Green
  Write-Host '==============================================' -ForegroundColor DarkGray
} else {
  Warn ('发布退出码: ' + $code)
  Warn '未能从日志解析出网址。若上方出现 non-interactive / API token 提示：'
  Write-Host '   到 https://dash.cloudflare.com/profile/api-tokens 建 Token（模板选 Edit Cloudflare Workers）' -ForegroundColor Gray
  Write-Host '   然后在本窗口执行：set CLOUDFLARE_API_TOKEN=粘贴token ，再重新双击本脚本' -ForegroundColor Gray
  if (Test-Path $transcript) { Write-Host ''; Write-Host '--- 日志末尾 ---' -ForegroundColor DarkGray; Get-Content $transcript | Select-Object -Last 12 }
}
Write-Host ''
Read-Host '按回车退出'

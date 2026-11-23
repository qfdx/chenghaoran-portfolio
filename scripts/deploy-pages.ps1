# 发布到 Cloudflare Pages → 永久网址（免费、pages.dev、国内可达）
# 用法：双击 桌面「发布永久网址.bat」
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot '.workbuddy\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $ProjectRoot
. (Join-Path $PSScriptRoot 'toolpaths.ps1')
$NPX = Find-Tool 'npx.cmd'
if (-not $NPX) { Write-Host '[deploy] 找不到 npx.cmd' -ForegroundColor Red; Read-Host '按回车退出'; exit 1 }

function Info($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor DarkGray }
function Good($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Yellow }

foreach ($dup in @('http_proxy', 'https_proxy', 'all_proxy')) {
  try { Remove-Item ('Env:' + $dup) -ErrorAction SilentlyContinue } catch {}
}

Info ('项目目录: ' + $ProjectRoot)

# ---------- 1. 登录 Cloudflare ----------
$logged = $false
try { & $NPX wrangler whoami *> $null; $logged = ($LASTEXITCODE -eq 0) } catch {}

if (-not $logged) {
  for ($i = 1; $i -le 5 -and -not $logged; $i++) {
    Write-Host ''
    Write-Host ('[' + $i + '/5] 浏览器会打开 Cloudflare 授权页，点「允许 / Allow」即可（有效期约 2 分钟）') -ForegroundColor Yellow
    Write-Host ''
    & $NPX wrangler login
    Start-Sleep -Seconds 2
    try { & $NPX wrangler whoami *> $null; $logged = ($LASTEXITCODE -eq 0) } catch {}
    if (-not $logged) { Warn '这轮没完成授权，稍后会自动再试一次' }
  }
}

if (-not $logged) {
  Warn '未完成 Cloudflare 登录，已放弃本次发布。'
  Warn '提示：浏览器最后跳到 localhost 显示「无法访问」也算成功，可重新双击本脚本。'
  Read-Host '按回车退出'
  exit 1
}
Good 'Cloudflare 登录成功'

# ---------- 2. 构建 ----------
Info '构建生产产物...'
& $NPX vite build
if ($LASTEXITCODE -ne 0) { Warn '构建失败'; Read-Host '按回车退出'; exit 1 }

# ---------- 3. 发布 ----------
Info '发布到 Cloudflare Pages（项目名 ch-haoran）...'
$deployLog = Join-Path $LogDir 'pages-deploy.log'
& $NPX wrangler pages deploy dist --project-name=ch-haoran --branch=main --commit-dirty=true 2>&1 | Tee-Object -FilePath $deployLog | Out-Null
Get-Content $deployLog | Select-Object -Last 16

# ---------- 4. 输出永久地址 ----------
$hit = Select-String -Path $deployLog -Pattern 'https://[a-z0-9.-]+\.pages\.dev' -AllMatches | Select-Object -Last 1
if ($hit) {
  $u = $hit.Matches[0].Value
  Set-Content -Path (Join-Path $ProjectRoot '公网地址.txt') -Value $u -Encoding utf8
  try { Set-Clipboard -Value $u } catch {}
  Write-Host ''
  Write-Host '==============================================' -ForegroundColor DarkGray
  Write-Host '  永久网址已生成（已复制到剪贴板）:' -ForegroundColor Green
  Write-Host ('    ' + $u) -ForegroundColor Yellow
  Write-Host '  已写入 公网地址.txt' -ForegroundColor Green
  Write-Host '==============================================' -ForegroundColor DarkGray
} else {
  Warn '发布已执行，但未能从日志解析出网址，请看上方输出。'
}
Write-Host ''
Read-Host '按回车退出'

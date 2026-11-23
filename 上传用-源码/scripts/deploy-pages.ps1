# 发布永久网址：Cloudflare 登录 -> 构建 -> 发布 -> 输出永久地址
# 由桌面快捷方式调用：powershell.exe -ExecutionPolicy Bypass -File 本脚本
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot '.workbuddy\logs'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $ProjectRoot

function Info($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor DarkGray }
function Good($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[deploy] ' + $m) -ForegroundColor Yellow }

foreach ($dup in @('http_proxy', 'https_proxy', 'all_proxy')) {
  try { Remove-Item ('Env:' + $dup) -ErrorAction SilentlyContinue } catch {}
}

Info ('项目目录: ' + $ProjectRoot)

# 自检模式：只做环境检查，不进入登录/发布流程（用于验证脚本链路是否正常）
if ($args -contains '-SelfTest') {
  Info '自检模式'
  Info ('PowerShell 版本: ' + $PSVersionTable.PSVersion)
  Info ('已登录 Cloudflare: ' + (Test-LoggedIn))
  Info ('npx 可用: ' + [bool](Get-Command npx.cmd -ErrorAction SilentlyContinue))
  Info ('wrangler 可用: ' + [bool](Test-Path (Join-Path $ProjectRoot 'node_modules\.bin\wrangler.cmd')))
  Write-Host ''
  Read-Host '按回车退出'
  exit 0
}

function Test-LoggedIn {
  $paths = @(
    (Join-Path $env:APPDATA 'xdg.config\.wrangler\config\default.toml'),
    (Join-Path $env:APPDATA '.wrangler\config\default.toml'),
    (Join-Path $env:USERPROFILE '.wrangler\config\default.toml')
  )
  foreach ($p in $paths) { if (Test-Path $p) { return $true } }
  return $false
}

$loggedIn = Test-LoggedIn
if (-not $loggedIn) {
  for ($attempt = 1; $attempt -le 8 -and -not $loggedIn; $attempt++) {
    Info ('第 ' + $attempt + '/8 次登录尝试：浏览器会自动弹出授权页，点「允许」即可')
    $out = Join-Path $LogDir ('wrangler-login-' + $attempt + '.log')
    $err = Join-Path $LogDir ('wrangler-login-' + $attempt + '.err.log')
    $sp = @{
      FilePath               = 'npx.cmd'
      ArgumentList           = @('wrangler', 'login')
      WorkingDirectory       = $ProjectRoot
      WindowStyle            = 'Hidden'
      RedirectStandardOutput = $out
      RedirectStandardError  = $err
      PassThru               = $true
    }
    $proc = Start-Process @sp

    $opened = $false
    $deadline = (Get-Date).AddSeconds(110)
    while ((Get-Date) -lt $deadline -and -not $proc.HasExited) {
      Start-Sleep -Milliseconds 700
      if (Test-Path $out) {
        $hit = Select-String -Path $out -Pattern 'oauth2/auth' -AllMatches | Select-Object -Last 1
        if ($hit -and -not $opened) {
          $opened = $true
          $line = $hit.Line
          $authUrl = ($line -split '\s+') | Where-Object { $_ -like 'https://dash.cloudflare.com/oauth2/auth*' } | Select-Object -First 1
          if ($authUrl) {
            Info '已在默认浏览器打开授权页'
            try { Start-Process $authUrl } catch {
              Info '自动打开失败，请手动复制下面链接到浏览器：'
              Write-Host $authUrl -ForegroundColor Yellow
            }
          }
        }
      }
    }
    if (-not $proc.HasExited) { try { $proc.Kill() } catch {} }
    Start-Sleep -Seconds 1
    $loggedIn = Test-LoggedIn
    if (-not $loggedIn) { Info '这轮没等到授权，浏览器会再次弹出' }
  }
}

if (-not $loggedIn) {
  Warn '未检测到登录成功。'
  Warn '提示：浏览器最后跳到 localhost 显示「无法访问」也算成功，可再点一次桌面快捷方式。'
  Write-Host ''
  Read-Host '按回车退出'
  exit 1
}
Good 'Cloudflare 登录成功'

Info '构建生产产物...'
& npx.cmd vite build
if ($LASTEXITCODE -ne 0) { Warn '构建失败'; Read-Host '按回车退出'; exit 1 }

Info '发布到 Cloudflare Pages（首次会自动创建项目 ch-haoran）...'
$deployLog = Join-Path $LogDir 'pages-deploy.log'
& npx.cmd wrangler pages deploy dist --project-name=ch-haoran --branch=main --commit-dirty=true 2>&1 | Tee-Object -FilePath $deployLog | Out-Null
Get-Content $deployLog | Select-Object -Last 14

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
  Warn '发布已完成，但未能从日志解析出网址，请看上方输出。'
}
Write-Host ''
Read-Host '按回车退出'

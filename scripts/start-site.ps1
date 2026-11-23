# 本地作品集守护脚本（自愈版）
#   - 确保生产服务在跑（监听 0.0.0.0，局域网可访问）
#   - 确保 Cloudflare 隧道在跑（强制 TCP/http2，避开被封的 QUIC/UDP）
#   - 隧道断线自动重启，地址变化时自动写入 公网地址.txt 并复制到剪贴板
# 用法：双击 启动网站.bat（在自己会话运行，关掉窗口即停止守护）
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = 'E:\新闻\其他\tools'
$UrlFile = Join-Path $ProjectRoot '公网地址.txt'
$LogDir = Join-Path $ProjectRoot '.workbuddy\logs'
$Cloudflared = Join-Path $ToolsDir 'cloudflared.exe'
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $ProjectRoot
. (Join-Path $PSScriptRoot 'toolpaths.ps1')
$NODE = Find-Tool 'node.exe'
if (-not $NODE) { Write-Host '[site] 找不到 node.exe' -ForegroundColor Red; Read-Host '按回车退出'; exit 1 }

foreach ($dup in @('http_proxy', 'https_proxy', 'all_proxy')) {
  try { Remove-Item ('Env:' + $dup) -ErrorAction SilentlyContinue } catch {}
}

function Info($m) { Write-Host ('[site] ' + $m) -ForegroundColor DarkGray }
function Good($m) { Write-Host ('[site] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[site] ' + $m) -ForegroundColor Yellow }

function Test-Port([int]$Port) {
  try {
    $c = New-Object System.Net.Sockets.TcpClient
    $iar = $c.BeginConnect('127.0.0.1', $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(1500, $false) -and $c.Connected
    $c.Close()
    return $ok
  } catch { return $false }
}

function Get-LanIP {
  try {
    $ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' }
    $wlan = $ips | Where-Object { $_.InterfaceAlias -like '*WLAN*' -or $_.InterfaceAlias -like '*无线*' } | Select-Object -First 1
    if ($wlan) { return $wlan.IPAddress }
    return ($ips | Select-Object -First 1).IPAddress
  } catch { return '' }
}

function Start-Server {
  Info '启动本地服务...'
  $env:HOST = '0.0.0.0'
  $sp = @{
    FilePath               = $NODE
    ArgumentList           = @('scripts/serve-prod.mjs')
    WorkingDirectory       = $ProjectRoot
    WindowStyle            = 'Hidden'
    RedirectStandardOutput = (Join-Path $LogDir 'serve.log')
    RedirectStandardError  = (Join-Path $LogDir 'serve.err.log')
    PassThru               = $true
  }
  $null = Start-Process @sp
  Start-Sleep -Seconds 2
}

function Start-Tunnel {
  Info '启动 Cloudflare 隧道（TCP/http2）...'
  $log = Join-Path $LogDir 'cloudflared.log'
  if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
  $sp = @{
    FilePath               = $Cloudflared
    ArgumentList           = @('tunnel', '--url', 'http://127.0.0.1:4173', '--no-autoupdate', '--protocol', 'http2')
    WorkingDirectory       = $ToolsDir
    WindowStyle            = 'Hidden'
    RedirectStandardOutput = $log
    RedirectStandardError  = (Join-Path $LogDir 'cloudflared.err.log')
    PassThru               = $true
  }
  return Start-Process @sp
}

Info ('项目目录: ' + $ProjectRoot)
if (-not (Test-Port 4173)) { Start-Server } else { Info '本地服务已在运行' }

$tunnel = $null
$lastUrl = ''
$lan = Get-LanIP

while ($true) {
  if (-not (Test-Port 4173)) {
    Warn '本地服务掉了，正在重启...'
    Start-Server
  }
  if (-not $tunnel -or $tunnel.HasExited) {
    Warn '隧道断开，正在重连...'
    $tunnel = Start-Tunnel
    Start-Sleep -Seconds 6
  }
  $log = Join-Path $LogDir 'cloudflared.log'
  if (Test-Path $log) {
    $m = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' -AllMatches | Select-Object -Last 1
    if ($m) {
      $url = $m.Matches[0].Value
      if ($url -ne $lastUrl) {
        $lastUrl = $url
        Set-Content -Path $UrlFile -Value $url -Encoding utf8
        try { Set-Clipboard -Value $url } catch {}
        Write-Host ''
        Write-Host '  [公网地址]' -ForegroundColor DarkGray
        Write-Host ('    ' + $url) -ForegroundColor Yellow
        if ($lan) { Write-Host ('  [局域网] http://' + $lan + ':4173') -ForegroundColor Yellow }
        Write-Host '  已复制到剪贴板' -ForegroundColor Green
        Write-Host ''
      }
    }
  }
  Start-Sleep -Seconds 8
}

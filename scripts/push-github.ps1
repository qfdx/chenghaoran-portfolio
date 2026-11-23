# 一键把代码推送到 GitHub（自动装 gh CLI → 浏览器授权 → 建仓库 → 推送）
# 用法：双击 推送代码到GitHub.bat（必须在你自己的桌面会话运行，才能走你自己的网络）
$ErrorActionPreference = 'Continue'
try { chcp 65001 > $null; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$RepoName = 'chenghaoran-portfolio'
$ToolsDir = Join-Path $ProjectRoot '.workbuddy\tools'
New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
Set-Location $ProjectRoot
. (Join-Path $PSScriptRoot 'toolpaths.ps1')
$NODE = Find-Tool 'node.exe'
$GIT = Find-Tool 'git.exe'
if (-not $GIT) { Write-Host '[github] 找不到 git.exe' -ForegroundColor Red; Read-Host '按回车退出'; exit 1 }
$env:PATH = (Split-Path -Parent $NODE) + ';' + $env:PATH

function Info($m) { Write-Host ('[github] ' + $m) -ForegroundColor DarkGray }
function Good($m) { Write-Host ('[github] ' + $m) -ForegroundColor Green }
function Warn($m) { Write-Host ('[github] ' + $m) -ForegroundColor Yellow }

# ---------- 1. 准备 gh CLI ----------
function Get-GhPath {
  $cmd = Get-Command gh.exe -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $local = Join-Path $ToolsDir 'gh.exe'
  if (Test-Path $local) { return $local }
  return $null
}

$gh = Get-GhPath
if (-not $gh) {
  Info '未检测到 gh CLI，正在下载（首次约 10MB）...'
  try {
    $api = Invoke-RestMethod -Uri 'https://api.github.com/repos/cli/cli/releases/latest' -Headers @{ 'User-Agent' = 'portfolio-setup' } -TimeoutSec 30
    $asset = $api.assets | Where-Object { $_.name -like '*windows_amd64.zip' } | Select-Object -First 1
    if (-not $asset) { throw '未找到 Windows 版 gh 压缩包' }
    $zip = Join-Path $ToolsDir 'gh.zip'
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zip -UseBasicParsing -TimeoutSec 180
    Expand-Archive -Path $zip -DestinationPath $ToolsDir -Force
    $exe = Get-ChildItem -Path $ToolsDir -Filter 'gh.exe' -Recurse | Select-Object -First 1
    if ($exe) {
      Copy-Item $exe.FullName (Join-Path $ToolsDir 'gh.exe') -Force
      $gh = Join-Path $ToolsDir 'gh.exe'
      Good ('gh CLI 已就绪: ' + $gh)
    }
  } catch {
    Warn ('下载 gh 失败: ' + $_.Exception.Message)
    Warn '请改用「个人访问令牌(PAT)」方式，见下方提示。'
  }
} else {
  Info ('使用已有 gh: ' + $gh)
}

# ---------- 2. 登录 ----------
$logged = $false
if ($gh) {
  try { & $gh auth status *> $null; $logged = ($LASTEXITCODE -eq 0) } catch {}
}
if (-not $logged) {
  Info '浏览器将打开 GitHub 授权页，粘贴/确认设备码即可（一次性）'
  & $gh auth login --hostname github.com --git-protocol https --web
  Start-Sleep -Seconds 3
  try { & $gh auth status *> $null; $logged = ($LASTEXITCODE -eq 0) } catch {}
}
if (-not $logged) {
  Warn '未完成 GitHub 登录。'
  Warn '备用方案（手动）：'
  Warn '  1) 打开 https://github.com/new 建一个空仓库（不要勾选 README），名如 ' + $RepoName
  Warn '  2) 打开 https://github.com/settings/tokens 生成 token（勾选 repo 权限）并复制'
  Warn '  3) 在本目录执行：'
  Warn '       git remote add origin https://github.com/<你的用户名>/' + $RepoName + '.git'
  Warn '       git push -u origin main'
  Read-Host '按回车退出'
  exit 1
}
Good 'GitHub 登录成功'

# ---------- 3. 建仓库并推送 ----------
$user = (& $gh api user --jq .login).Trim()
Info ('当前 GitHub 账号: ' + $user)

# 统一分支名为 main（Cloudflare Pages 默认构建分支）
& $GIT branch -M main 2>$null
& $GIT add -A 2>$null
& $GIT commit -q -m 'feat: personal portfolio site' --allow-empty 2>$null

$repoFull = $user + '/' + $RepoName
& $gh repo view $repoFull *> $null
$already = ($LASTEXITCODE -eq 0)

# 让 git 使用 gh 的凭据（本机未安装 Git Credential Manager，必须这一步）
& $gh auth setup-git 2>$null

if (-not $already) {
  Info ('创建仓库: ' + $repoFull)
  & $gh repo create $repoFull --public --source=. *> $null
} else {
  Info ('仓库已存在: ' + $repoFull + '，直接推送')
}

& $GIT remote remove origin 2>$null
& $GIT remote add origin ('https://github.com/' + $repoFull + '.git')
& $GIT push -u origin main --force
$ok = ($LASTEXITCODE -eq 0)

if ($ok) {
  Good ('推送完成: https://github.com/' + $repoFull)
  Write-Host ''
  Write-Host '  下一步（Cloudflare Pages 连 GitHub）:' -ForegroundColor DarkGray
  Write-Host '   1) 打开 https://dash.cloudflare.com/ -> Workers 和 Pages -> 创建 -> 连接 Git'
  Write-Host ('   2) 选择仓库 ' + $repoFull)
  Write-Host '   3) 构建配置：构建命令 npm run build ，输出目录 dist，环境变量 NODE_VERSION=22'
  Write-Host '   4) 部署后得到 https://ch-haoran.pages.dev（永久地址）'
  Write-Host ''
} else {
  Warn '推送失败，请看上方错误信息。'
  Warn '手动方案：'
  Warn ('  git remote add origin https://github.com/' + $repoFull + '.git')
  Warn '  git push -u origin main'
}
Read-Host '按回车退出'

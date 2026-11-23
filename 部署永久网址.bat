@echo off
chcp 65001 >nul
title 部署永久网址（Cloudflare Pages）
set "PROJ=E:\个人知识库\个人网站"
cd /d "%PROJ%"

echo ==========================================
echo   发布你的作品集到 Cloudflare Pages
echo   得到永久网址（形如 ch-haoran.pages.dev）
echo ==========================================
echo.

echo [1/3] 登录 Cloudflare ...
echo       浏览器会自动弹出授权页面，点"允许 / Allow"即可。
echo       （没有账号会引导你免费注册，只需邮箱）
echo.
call npx wrangler login
if errorlevel 1 (
  echo.
  echo [!] 登录失败或超时，请重新双击本文件。
  pause & exit /b 1
)

echo.
echo [2/3] 构建生产产物 ...
call npx vite build
if errorlevel 1 (
  echo [!] 构建失败
  pause & exit /b 1
)

echo.
echo [3/3] 发布到 Cloudflare Pages ...
set "DEPLOYLOG=%TEMP%\pages-deploy.log"
call npx wrangler pages deploy dist --project-name=ch-haoran --branch=main --commit-dirty=true > "%DEPLOYLOG%" 2>&1
type "%DEPLOYLOG%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command ^
  "$m = Select-String -Path '%DEPLOYLOG%' -Pattern 'https://[a-z0-9.-]+\.pages\.dev' | Select-Object -Last 1; if ($m) { $u = $m.Matches[0].Value; Set-Content -Path '%PROJ%\公网地址.txt' -Value $u -Encoding utf8; Set-Clipboard -Value $u; Write-Host ''; Write-Host '=========================================='; Write-Host '  永久网址已生成（已复制到剪贴板）:' -ForegroundColor Green; Write-Host ('    ' + $u) -ForegroundColor Yellow; Write-Host '  同时写入 公网地址.txt' -ForegroundColor Green; Write-Host '==========================================' } else { Write-Host '未解析到网址，请查看上方日志' -ForegroundColor Red }"

echo.
pause

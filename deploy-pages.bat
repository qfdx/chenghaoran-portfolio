@echo off
chcp 65001 >nul
title 发布作品集到 Cloudflare Pages（永久网址）
cd /d "%~dp0"

echo [1/2] 构建生产产物...
call npx vite build
if errorlevel 1 (
  echo [!] 构建失败
  pause & exit /b 1
)

echo.
echo [2/2] 发布到 Cloudflare Pages...
call npx wrangler pages deploy dist --project-name=ch-haoran --branch=main --commit-dirty=true
echo.
echo 部署完成后，控制台会给出永久网址（形如 https://ch-haoran.pages.dev）。
pause

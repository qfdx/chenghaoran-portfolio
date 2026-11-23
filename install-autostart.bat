@echo off
chcp 65001 >nul
title 安装开机自启（登录后自动启动网站 + 隧道）
echo.
echo 将在你每次登录 Windows 后自动启动：
echo   1) 本地生产服务（127.0.0.1:4173）
echo   2) Cloudflare 隧道，并把公网地址复制到剪贴板
echo.
echo 如需查看/复制地址，随时双击 start-site.bat 即可。
echo.
schtasks /create /tn "PortfolioSite" /sc onlogon /rl limited /tr "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%~dp0scripts\start-site.ps1\"" /f
echo.
if errorlevel 1 (
  echo [!] 创建失败。若提示权限不足，请右键本文件 → 以管理员身份运行。
) else (
  echo [OK] 已创建自启任务 PortfolioSite。
)
echo.
pause

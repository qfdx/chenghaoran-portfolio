@echo off
chcp 65001 >nul
title 个人网站 - 本地服务 + 公网隧道
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\start-site.ps1"
echo.
echo （地址已复制到剪贴板；关闭此窗口不会停止服务）
timeout /t 8 >nul

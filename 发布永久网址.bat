@echo off
title Deploy Portfolio to Cloudflare Pages (free, permanent URL)
cd /d "E:\个人知识库\个人网站"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -NoProfile -File "E:\个人知识库\个人网站\scripts\deploy-pages.ps1"
echo.
pause

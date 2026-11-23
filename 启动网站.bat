@echo off
title Portfolio Site Keeper (keep this window open)
cd /d "E:\个人知识库\个人网站"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -NoProfile -File "E:\个人知识库\个人网站\scripts\start-site.ps1"
echo.
pause

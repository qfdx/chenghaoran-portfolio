@echo off
title Push portfolio to GitHub
cd /d "E:\个人知识库\个人网站"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -ExecutionPolicy Bypass -NoProfile -File "E:\个人知识库\个人网站\scripts\push-github.ps1"
echo.
pause

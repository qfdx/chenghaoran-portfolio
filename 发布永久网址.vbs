' Launcher: run the deploy script in a visible PowerShell window
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -File ""E:\个人知识库\个人网站\scripts\deploy-pages.ps1""", 1, False

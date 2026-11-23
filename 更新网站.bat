@echo off
chcp 65001 >nul
title Build and package for EdgeOne Pages
cd /d "E:\个人知识库\个人网站"

echo [1/2] Build...
call npx vite build
if errorlevel 1 (
  echo [!] Build failed
  pause & exit /b 1
)

echo [2/2] Packaging...
"C:\Users\lenovo\.workbuddy\binaries\python\envs\default\Scripts\python.exe" -c "import shutil,os,zipfile;src=r'E:\个人知识库\个人网站\dist';out=r'E:\个人知识库\个人网站\dist-上传用.zip';os.path.exists(out) and os.remove(out);z=zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED);[z.write(os.path.join(r,f),os.path.relpath(os.path.join(r,f),src)) for r,d,fs in os.walk(src) for f in fs];z.close();print('OK: %s (%.1f MB)'%(out,os.path.getsize(out)/1024/1024))"

echo.
echo 完成。请到 EdgeOne Pages 控制台点「重新部署」并上传：
echo     E:\个人知识库\个人网站\dist-上传用.zip
pause

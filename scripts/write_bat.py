# 生成含中文路径的 .bat（必须 GBK 编码，否则 cmd 读 UTF-8 会碎成乱码命令）
bat = (
    "@echo off\n"
    "title Deploy Portfolio to Cloudflare Pages (free, permanent URL)\n"
    "cd /d \"E:\\个人知识库\\个人网站\"\n"
    "\"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -ExecutionPolicy Bypass -NoProfile -File \"E:\\个人知识库\\个人网站\\scripts\\deploy-pages.ps1\"\n"
    "echo.\n"
    "pause\n"
)

targets = [
    r"E:\个人知识库\个人网站\发布永久网址.bat",
    r"C:\Users\lenovo\Desktop\发布永久网址.bat",
]
for p in targets:
    with open(p, "w", encoding="gbk", newline="\r\n") as f:
        f.write(bat)
    print("written GBK:", p)

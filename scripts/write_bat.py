# 生成含中文路径的 .bat（必须 GBK 编码，否则 cmd 读 UTF-8 会碎成乱码命令）
bats = {
    "推送代码到GitHub.bat": (
        "@echo off\n"
        "title Push portfolio to GitHub\n"
        "cd /d \"E:\\个人知识库\\个人网站\"\n"
        "\"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -ExecutionPolicy Bypass -NoProfile -File \"E:\\个人知识库\\个人网站\\scripts\\push-github.ps1\"\n"
        "echo.\n"
        "pause\n"
    ),
    "发布永久网址.bat": (
        "@echo off\n"
        "title Deploy Portfolio to Cloudflare Pages\n"
        "cd /d \"E:\\个人知识库\\个人网站\"\n"
        "\"%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe\" -ExecutionPolicy Bypass -NoProfile -File \"E:\\个人知识库\\个人网站\\scripts\\deploy-pages.ps1\"\n"
        "echo.\n"
        "pause\n"
    ),
}

for name, body in bats.items():
    for p in (rf"E:\个人知识库\个人网站\{name}", rf"C:\Users\lenovo\Desktop\{name}"):
        with open(p, "w", encoding="gbk", newline="\r\n") as f:
            f.write(body)
        print("written GBK:", p)

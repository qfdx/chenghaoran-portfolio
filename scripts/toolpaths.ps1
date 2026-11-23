# 定位 node / npx / git：这些工具装在 WorkBuddy 的 binaries 目录，未加入用户 PATH，
# 双击脚本运行时 Get-Command 找不到，必须自己解析绝对路径。
function Find-Tool {
  param([Parameter(Mandatory = $true)][string]$Name)

  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $nodeRoot = Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions'
  if ($Name -match '^(node|npm|npx)') {
    if (Test-Path $nodeRoot) {
      $ver = Get-ChildItem $nodeRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d' } | Sort-Object Name -Descending | Select-Object -First 1
      if ($ver) {
        $p = Join-Path $ver.FullName $Name
        if (Test-Path $p) { return $p }
      }
    }
  }

  $gitRoot = Join-Path $env:USERPROFILE '.workbuddy\binaries\PortableGit\versions'
  if ($Name -eq 'git.exe' -and (Test-Path $gitRoot)) {
    $ver = Get-ChildItem $gitRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($ver) {
      foreach ($rel in @('mingw64\bin\git.exe', 'cmd\git.exe', 'bin\git.exe', 'usr\bin\git.exe')) {
        $p = Join-Path $ver.FullName $rel
        if (Test-Path $p) { return $p }
      }
    }
  }

  foreach ($base in @('C:\Program Files\nodejs', 'C:\Program Files\Git', 'C:\Program Files (x86)\Git')) {
    $p = Join-Path $base $Name
    if (Test-Path $p) { return $p }
  }
  return $null
}

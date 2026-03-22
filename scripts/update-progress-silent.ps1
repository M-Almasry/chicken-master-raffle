# سكريبت التحديث الصامت للفجر (بدون واجهة)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$batPath = Join-Path $scriptDir "auto-update.bat"

# تشغيل التحديث في الخلفية بدون نافذة وبدون توقف
Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$batPath`" --silent" -WindowStyle Hidden -Wait

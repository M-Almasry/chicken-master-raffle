# مسار المشروع (ديناميكي)
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# 1. جلب التحديثات بصمت تام في الخلفية
git fetch origin main *>&1 | Out-Null

$local = git rev-parse HEAD
$remote = git rev-parse origin/main

# إذا لم يكن هناك تحديث، اغلق بصمت ولا تزعج أحداً
if ($local -eq $remote) {
    exit 0
}

# 2. يوجد تحديث! نفحص الساعة الحالية
$hour = (Get-Date).Hour

# 3. شرط الوقت: من الساعة 2 فجراً حتى 4:59 فجراً (تحديث إجباري صامت)
if ($hour -ge 2 -and $hour -lt 5) {
    # تشغيل سكريبت التحديث الصامت
    Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$projectRoot\scripts\update-progress-silent.ps1`"" -WindowStyle Hidden
} 
# 4. في باقي ساعات اليوم: اسأل المستخدم بأدب
else {
    Add-Type -AssemblyName System.Windows.Forms
    
    $msgText = "يوجد تحديث جديد لنظام Chicken Master Raffle.`nهل ترغب بتثبيته الآن؟"
    $msgTitle = "تحديث النظام"
    $msgButtons = [System.Windows.Forms.MessageBoxButtons]::YesNo
    $msgIcon = [System.Windows.Forms.MessageBoxIcon]::Information
    $msgDefault = [System.Windows.Forms.MessageBoxDefaultButton]::Button1
    
    $msgOptions = [System.Windows.Forms.MessageBoxOptions]::RightAlign -bOr [System.Windows.Forms.MessageBoxOptions]::RtlReading
    
    $result = [System.Windows.Forms.MessageBox]::Show($msgText, $msgTitle, $msgButtons, $msgIcon, $msgDefault, $msgOptions)

    if ($result -eq 'Yes') {
        # السحر هنا: نفتح واجهة التحميل الخضراء بدلاً من الـ CMD ونخفي نافذة الباورشيل
        Start-Process -FilePath "powershell.exe" -ArgumentList "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$projectRoot\scripts\update-progress.ps1`"" -WindowStyle Hidden
    }
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# تحديد مسار المجلد الحالي والايقونة
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$batPath = Join-Path $scriptDir "auto-update.bat"
$logoPath = Join-Path $scriptDir "..\frontend\public\logo.png"

# 1. إعداد النافذة الرئيسية
$form = New-Object System.Windows.Forms.Form
$form.Text = "تحديث نظام Chicken Master"
$form.Size = New-Object System.Drawing.Size(420, 230)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.ControlBox = $false 
$form.RightToLeft = "Yes"
$form.RightToLeftLayout = $true
$form.BackColor = [System.Drawing.Color]::White

# إضافة اللوجو
if (Test-Path $logoPath) {
    $pictureBox = New-Object System.Windows.Forms.PictureBox
    $pictureBox.Image = [System.Drawing.Image]::FromFile($logoPath)
    $pictureBox.SizeMode = [System.Windows.Forms.PictureBoxSizeMode]::Zoom
    $pictureBox.Size = New-Object System.Drawing.Size(50, 50)
    $pictureBox.Location = New-Object System.Drawing.Point(340, 15)
    $form.Controls.Add($pictureBox)
}

# 2. نص الحالة
$label = New-Object System.Windows.Forms.Label
$label.Text = "جاري جلب التحديثات وبناء النظام... يرجى الانتظار"
$label.AutoSize = $true
$label.Font = New-Object System.Drawing.Font("Segoe UI", 10)
$label.Location = New-Object System.Drawing.Point(30, 40)
$form.Controls.Add($label)

# 3. شريط التحميل (وضع الـ Blocks لمحاكاة الزحف)
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(30, 90)
$progressBar.Size = New-Object System.Drawing.Size(340, 25)
$progressBar.Style = [System.Windows.Forms.ProgressBarStyle]::Blocks
$progressBar.Value = 0
$form.Controls.Add($progressBar)

# 4. زر الإنهاء
$btnFinish = New-Object System.Windows.Forms.Button
$btnFinish.Text = "إغلاق"
$btnFinish.Size = New-Object System.Drawing.Size(80, 30)
$btnFinish.Location = New-Object System.Drawing.Point(160, 140)
$btnFinish.Visible = $false
$btnFinish.Cursor = [System.Windows.Forms.Cursors]::Hand
$btnFinish.Add_Click({ $form.Close() })
$form.Controls.Add($btnFinish)

# 5. تشغيل سكريبت التحديث مع "الزحف الذكي"
$form.Add_Shown({
    $scriptBlock = {
        param($path)
        Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$path`" --silent" -WindowStyle Hidden -Wait
    }
    
    $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $batPath
    
    # محاكاة التحميل الذكي (Fake Progress) حتى 75%
    $fakeProgress = 0
    while ((Get-Job -Id $job.Id).State -eq "Running") {
        if ($fakeProgress -lt 75) {
            $fakeProgress += 1
            $progressBar.Value = $fakeProgress
        }
        [System.Windows.Forms.Application]::DoEvents()
        Start-Sleep -Milliseconds 300 # سرعة الزحف
    }
    
    # تنظيف المهمة والقفزة الأخيرة
    Receive-Job -Job $job | Out-Null
    Remove-Job -Job $job
    
    $progressBar.Value = 100
    $label.Text = "تم التحديث بنجاح! النظام الآن بأحدث نسخة. ✅"
    $btnFinish.Visible = $true
    $form.ControlBox = [bool]1 
})

$form.ShowDialog()

Set WinScriptHost = CreateObject("WScript.Shell")
' هذا السطر يشغل ملف الـ PowerShell ويخفيه تماماً من اللحظة الأولى
WinScriptHost.Run "powershell.exe -ExecutionPolicy Bypass -File ""C:\SmartMart\watcher.ps1""", 0, False
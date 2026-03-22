@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

:: =========================================
:: CONFIGURATION
:: =========================================
set DB_NAME=chickenmaster_db
set DB_USER=postgres
set DB_PASS=124578963@@

:: تحديد مسار المشروع تلقائياً
set "PROJECT_ROOT=%~dp0.."
set BACKUP_DIR=%PROJECT_ROOT%\Backups

:: [1] توليد تاريخ ثابت ISO لا يخطئ أبداً (yyyyMMdd_HHmm)
for /f "usebackq" %%i in (`powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmm'"`) do set "TIMESTAMP=%%i"

set FILENAME=%BACKUP_DIR%\ChickenMaster_Raffle_DB_%TIMESTAMP%.sql

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [%TIMESTAMP%] Starting Professional Backup...

:: [2] البحث عن مسار PostgreSQL تلقائياً (بناءً على أعلى نسخة موجودة)
set "PG_PATH="
for /d %%v in ("C:\Program Files\PostgreSQL\*") do (
    if exist "%%v\bin\pg_dump.exe" set "PG_PATH=%%v\bin"
)

if not defined PG_PATH (
    echo [ERROR] PostgreSQL not found in C:\Program Files\PostgreSQL\
    exit /b 1
)

:: [3] تمرير كلمة السر برمجياً
set PGPASSWORD=%DB_PASS%

:: [4] تنفيذ النسخ الاحتياطي
"%PG_PATH%\pg_dump.exe" -U %DB_USER% -d %DB_NAME% -f "%FILENAME%"

if %errorlevel% equ 0 (
    echo [✓] SUCCESS: Backup saved to %FILENAME%
    
    :: [5] تنظيف قديم: مسح الملفات التي مر عليها أكثر من 30 يوماً
    forfiles /p "%BACKUP_DIR%" /s /m *.sql /d -30 /c "cmd /c del @path"
    echo [✓] Cleanup: Old backups deleted.
) else (
    echo [ERROR] Backup FAILED! >> "%PROJECT_ROOT%\logs\backup_errors.log"
    set PGPASSWORD=
    exit /b 1
)

:: مسح كلمة السر من الذاكرة
set PGPASSWORD=
echo [DONE] Backup process finished.
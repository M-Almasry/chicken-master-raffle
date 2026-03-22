@echo off
setlocal enabledelayedexpansion

:: =========================================
:: Chicken Master - Bulletproof Auto-Update Script (v3.2) - The Loud Version
:: =========================================

set "PROJECT_ROOT=%~dp0.."
cd /d "%PROJECT_ROOT%"

:: [NEW] Check for silent mode
set "SILENT_MODE=0"
if "%1"=="--silent" set "SILENT_MODE=1"

if not exist "logs" mkdir logs
echo --- Starting Update Check (v3.2) ---
echo [%date% %time%] --- Starting Update Check (v3.2) --- >> logs\update.log

FOR /F "usebackq" %%i IN (`git rev-parse HEAD`) DO SET OLD_HASH=%%i

:: [تنبيه تم إزالة سطر HTTPS لأننا نعتمد على SSH الآن]

:: [1] جلب التحديثات
echo [*] Checking GitHub for updates...
git fetch origin main 2>>logs\update-error.log
if %errorlevel% neq 0 (
    echo [!] ERROR: Git fetch failed! 
    echo [!] Please check your internet connection or SSH keys.
    echo [%date% %time%] Git fetch failed. >> logs\update.log
    if "%SILENT_MODE%"=="0" pause
    exit /b 1
)

:: التحقق من وجود فروقات
FOR /F "usebackq" %%i IN (`git rev-parse HEAD`) DO SET LOCAL_HASH=%%i
FOR /F "usebackq" %%i IN (`git rev-parse origin/main`) DO SET REMOTE_HASH=%%i

IF "%LOCAL_HASH%"=="%REMOTE_HASH%" (
    echo.
    echo [*] No updates found. System is up to date.
    echo [%date% %time%] No updates found. System is up to date. >> logs\update.log
    if "%SILENT_MODE%"=="0" pause
    exit /b 0
)

echo.
echo [*] UPDATE FOUND! Starting Deployment Process...
echo [%date% %time%] UPDATE FOUND! Starting Deployment Process... >> logs\update.log

:: [2] حماية ملفات البيئة
echo [*] Step 1: Backing up database and .env files...
call scripts\backup-db.bat
if exist "backend\.env" copy /Y "backend\.env" "logs\backend-env.bak" >nul
if exist "frontend\.env" copy /Y "frontend\.env" "logs\frontend-env.bak" >nul

:: [3] تحديث الكود بالقوة
echo [*] Step 2: Syncing code with origin/main...
git reset --hard origin/main >> logs\update.log 2>&1
git clean -fd >> logs\update.log 2>&1

:: [4] استرجاع ملفات البيئة المحلية
echo [*] Step 3: Restoring local .env files...
if exist "logs\backend-env.bak" copy /Y "logs\backend-env.bak" "Backend\.env" >nul
if exist "logs\frontend-env.bak" copy /Y "logs\frontend-env.bak" "Frontend\.env" >nul

:: [5] تحديث الباك إند
echo [*] Step 4: Updating Backend...
cd backend
call npm install --production >> ..\logs\update.log 2>&1 && (
    echo [*] Running migrations...
    node migrations/migrate.js >> ..\logs\update.log 2>&1
) || (
    echo.
    echo [!] ERROR: Backend update failed! Rolling back code...
    cd ..
    git reset --hard %OLD_HASH% >> logs\update.log 2>&1
    if exist "logs\backend-env.bak" copy /Y "logs\backend-env.bak" "Backend\.env" >nul
    if exist "logs\frontend-env.bak" copy /Y "logs\frontend-env.bak" "Frontend\.env" >nul
    pause
    exit /b 1
)
cd ..

:: [6] تحديث الفرونت إند
echo [*] Step 5: Updating Frontend...
cd frontend
call npm install >> ..\logs\update.log 2>&1 && (
    echo [*] Building Frontend production files...
    call npm run build >> ..\logs\update.log 2>&1
) || (
    echo.
    echo [!] ERROR: Frontend build failed! Rolling back code...
    cd ..
    git reset --hard %OLD_HASH% >> logs\update.log 2>&1
    if exist "logs\backend-env.bak" copy /Y "logs\backend-env.bak" "Backend\.env" >nul
    if exist "logs\frontend-env.bak" copy /Y "logs\frontend-env.bak" "Frontend\.env" >nul
    pause
    exit /b 1
)
cd ..

:: [7] إعادة تشغيل PM2
echo [*] Step 6: Restarting PM2 processes...
pm2 restart chicken-raffle-backend --update-env >> logs\update.log 2>&1
pm2 delete chicken-raffle-frontend >> logs\update.log 2>&1
pm2 start ecosystem.config.js --only chicken-raffle-frontend >> logs\update.log 2>&1
pm2 save >> logs\update.log 2>&1

echo.
echo =========================================
echo [DONE] Update successful and deployed!
echo =========================================
echo [%date% %time%] Update successful and deployed! >> logs\update.log
if "%SILENT_MODE%"=="0" pause